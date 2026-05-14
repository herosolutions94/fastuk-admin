// scheduler/jobNotifier.js

const cron = require("node-cron");
const pool = require("../config/db-connection");

// =====================================================
// CLEAR DRIVER EARNINGS
// 1st  -> clears previous month 16 -> last day
// 15th -> clears current month 1 -> 15
// =====================================================

const clearDriverEarnings = async () => {

    try {

        const today = new Date();

        const currentDay = today.getDate();
        // const currentDay = 15; // FORCE TEST MODE

        let startDate;
        let endDate;

        // =====================================================
        // 1ST OF MONTH
        // Previous month 16 -> last day
        // =====================================================
        if (currentDay === 1) {

            startDate = new Date(
                today.getFullYear(),
                today.getMonth() - 1,
                16,
                0,
                0,
                0
            );

            endDate = new Date(
                today.getFullYear(),
                today.getMonth(),
                0,
                23,
                59,
                59
            );
        }

        // =====================================================
        // 15TH OF MONTH
        // Current month 1 -> 15
        // =====================================================
        else if (currentDay === 15) {

            startDate = new Date(
                today.getFullYear(),
                today.getMonth(),
                1,
                0,
                0,
                0
            );

            endDate = new Date(
                today.getFullYear(),
                today.getMonth(),
                15,
                23,
                59,
                59
            );
        }

        else {

            console.log("⏩ Not payout day");
            return;
        }

        console.log("🚀 Clearing earnings from:", startDate);
        console.log("🚀 Clearing earnings till:", endDate);

        // =====================================================
        // GET EARNINGS
        // earnings pending
        // request_quote completed
        // =====================================================

        const [rows] = await pool.query(
            `
      SELECT e.id, e.order_id
      FROM earnings e
      INNER JOIN request_quote rq
        ON rq.id = e.order_id
      WHERE e.status = 'pending'
        AND rq.status = 'completed'
        AND rq.updated_time BETWEEN ? AND ?
      `,
            [startDate, endDate]
        );

        if (!rows.length) {

            console.log("⏩ No earnings found to clear");
            return;
        }

        console.log(`🚀 Found ${rows.length} earnings`);

        // =====================================================
        // UPDATE EARNINGS STATUS
        // =====================================================

        await pool.query(
            `
      UPDATE earnings e
      INNER JOIN request_quote rq
        ON rq.id = e.order_id
      SET e.status = 'cleared',
          e.updated_at = NOW()
      WHERE e.status = 'pending'
        AND rq.status = 'completed'
        AND rq.updated_time BETWEEN ? AND ?
      `,
            [startDate, endDate]
        );

        console.log(`✅ ${rows.length} earnings cleared`);

    } catch (error) {

        console.error("❌ Error clearing earnings:", error);
    }
};

// =====================================================
// CRON - 1ST OF MONTH
// =====================================================

cron.schedule("0 0 1 * *", async () => {
    // cron.schedule("* * * * *", async () => {

    console.log("🚀 Testing payout cron (every 1 min):", new Date());


    console.log("🚀 Running payout cron (1st):", new Date());

    try {

        await clearDriverEarnings();

    } catch (err) {

        console.error("❌ 1st payout cron error:", err);
    }
});

// =====================================================
// CRON - 15TH OF MONTH
// =====================================================

cron.schedule("0 0 15 * *", async () => {
    // cron.schedule("*/2 * * * *", async () => {
    console.log("🚀 Testing payout cron (every 2 min):", new Date());


    console.log("🚀 Running payout cron (15th):", new Date());

    try {

        await clearDriverEarnings();

    } catch (err) {

        console.error("❌ 15th payout cron error:", err);
    }
});