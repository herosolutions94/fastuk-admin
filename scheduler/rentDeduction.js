// scheduler/jobNotifier.js
const cron = require("node-cron");
const helpers = require("../utils/helpers");
const pool = require("../config/db-connection"); // ✅ FIXED


const deductMonthlyVehicleRent = async () => {
  try {

    const [rows] = await pool.query(`
      SELECT rider_id, category_id, vehicle_rent 
      FROM rider_vehicle_categories
      WHERE vehicle_rent IS NOT NULL 
        AND vehicle_rent > 0
    `);

    if (!rows.length) {
      console.log("No vehicles found for rent deduction");
      return;
    }

    const now = new Date();

    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    // MySQL-safe datetime
const createdTime = Math.floor(Date.now() / 1000);
    for (const row of rows) {
      const { rider_id, category_id, vehicle_rent } = row;

      // ✅ safer duplicate check (NO JSON issues)
      const [existing] = await pool.query(`
        SELECT id 
        FROM earnings 
        WHERE user_id = ?
          AND earning_type = 'rent'
          AND order_id IS NULL
          AND category_id = ?
          AND MONTH(created_time) = ?
          AND YEAR(created_time) = ?
        LIMIT 1
      `, [rider_id, category_id, month, year]);

      if (existing.length > 0) {
        console.log(`⏩ Rent already deducted for rider ${rider_id}, vehicle ${category_id}`);
        continue;
      }

      // ✅ insert earnings
      await helpers.insertEarnings({
        user_id: rider_id,
        amount: vehicle_rent,
        type: "debit",
        status: "approved",
        created_time: createdTime,   // ✅ FIXED
        order_id: null,
        earning_type: "rent",
        category_id: category_id     // ✅ store directly (NOT meta)
      });

      console.log(`✅ Rent deducted: Rider ${rider_id}, Vehicle ${category_id}, Amount ${vehicle_rent}`);
    }

  } catch (error) {
    console.error("Error in rent deduction:", error);
  }
};

cron.schedule("0 0 1 * *", async () => {
  console.log("🚀 Running Monthly Rent Deduction:", new Date());

  try {
    await deductMonthlyVehicleRent();
  } catch (err) {
    console.error("❌ Monthly rent cron error:", err);
  }
});