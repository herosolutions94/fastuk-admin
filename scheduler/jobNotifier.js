// scheduler/jobNotifier.js
const cron = require("node-cron");
const RequestQuoteModel = require("../models/request-quote");
const helpers = require("../utils/helpers");
const pool = require("../config/db-connection"); // ✅ FIXED

const handlePickupNotification = async (job, type) => {

  if (!job.assigned_rider || job.status !== "accepted" || job.is_ready == 1) {
    return;
  }

  // ========================
  // 🟢 ASAP ONLY
  // ========================
  if (type === "asap") {

    if (job.pickup_time_option !== "asap") return;

    const jobDate = new Date(job.start_date);
    const today = new Date().toISOString().slice(0, 10);

    if (jobDate.toISOString().slice(0, 10) !== today) return;

    const last = job.last_asap_notification
      ? new Date(job.last_asap_notification)
      : null;

    const diffMin = last ? (new Date() - last) / 60000 : null;

    if (!last || diffMin >= 5) {

      await sendNotification(job,
        "Collection is ASAP. Please make your way to pickup location."
      );

      await sendAsapEmailReminder(job);

      await pool.query(
        `UPDATE request_quote SET last_asap_notification = UTC_TIMESTAMP() WHERE id = ?`,
        [job.id]
      );
    }

    return;
  }

  // ========================
  // 🟡 TIMED ONLY
  // ========================
  if (type === "timed") {

    const pickupTime = getPickupTimestamp(job);
    if (!pickupTime) return;

    const nowSec = Math.floor(Date.now() / 1000);
    const diff = pickupTime - nowSec;

    if (diff <= 0) return;

    if (diff <= 3600 && diff > 3300 && !job.pickup_notified) {

      await sendNotification(job,
        "Pickup is scheduled in 1 hour. Please be ready."
      );

      await sendTimedEmailReminder(job);

      await markPickupNotified(job.id);
    }

    return;
  }
};

cron.schedule("* * * * *", async () => {
  console.log("Running job notifier...");
  console.log("CRON:", new Date().toISOString());

  try {

    const asapJobs = await RequestQuoteModel.getASAPJobsForNotification();
    const timedJobs = await RequestQuoteModel.getTimedJobsForNotification();

    for (const job of asapJobs) {
      await handlePickupNotification(job, "asap");
    }

    for (const job of timedJobs) {
      await handlePickupNotification(job, "timed");
    }

  } catch (error) {
    console.error("Cron error:", error);
  }
});



const getPickupTimestamp = (job) => {
  let dateTime;

  if (job.pickup_time_option === "at") {
    dateTime = job.pickup_time;
  } else if (job.pickup_time_option === "before") {
    dateTime = job.pickup_end_time;
  } else if (job.pickup_time_option === "between") {
    dateTime = job.pickup_start_time;
  }

  console.log("🧪 FINAL DATETIME:", dateTime);

  if (!dateTime) return null;

  const ts = new Date(dateTime).getTime();

  if (isNaN(ts)) return null;

  return Math.floor(ts / 1000);
};

const sendNotification = async (job, message) => {
  const encodedId = helpers.doEncode(String(job.id));

  const link = `/rider-dashboard/order-details/${encodedId}`;

  const riderId = job.assigned_rider; // ✅ ALWAYS USE THIS

  console.log("Sending notification to rider:", riderId);

  // 🔔 Rider
  await helpers.storeNotification(
    riderId,
    "rider",
    0,
    message,
    link
  );

  // 🔔 Admin
  await helpers.storeNotification(
    1,
    "admin",
    riderId,
    message,
    link
  );

};

const sendAsapEmailReminder = async (job) => {
  try {
    if (!job.assigned_rider || job.is_ready == 1) return;

    const last = job.last_asap_email;
    const now = new Date();

    if (last) {
      const diffMin = (now - new Date(last)) / (1000 * 60);
      if (diffMin < 5) return;
    }

    const riderEmail = job.rider_email; // adjust field name

    const subject = "ASAP Collection Reminder";

    const templateData = {
      job,
      message:
        "Collection is ASAP. Please make your way to pickup location immediately.",
      adminData: job.adminData,
    };

    await helpers.sendEmail(
      [riderEmail, job.admin_email],
      subject,
      "asap-reminder",
      templateData
    );

    await pool.query(
      `UPDATE request_quote SET last_asap_email = NOW() WHERE id = ?`,
      [job.id]
    );
  } catch (err) {
    console.error("ASAP email error:", err);
  }
};

const sendTimedEmailReminder = async (job) => {
  try {
    if (!job.assigned_rider || job.is_ready == 1) return;

    const pickupTime = getPickupTimestamp(job);
    if (!pickupTime) return;

    const nowSec = Math.floor(Date.now() / 1000);
    const diff = pickupTime - nowSec;

    // 1 hour window (3600 sec ± 300 sec tolerance)
    if (diff <= 3600 && diff > 3300 && !job.timed_email_sent) {
      const riderEmail = job.rider_email;

      const subject = "Pickup Reminder (1 Hour Left)";

      const templateData = {
        job,
        message:
          "Your pickup is scheduled in 1 hour. Please be ready.",
        adminData: job.adminData,
      };

      await helpers.sendEmail(
        [riderEmail, job.admin_email],
        subject,
        "timed-reminder",
        templateData
      );

      await pool.query(
        `UPDATE request_quote SET timed_email_sent = 1 WHERE id = ?`,
        [job.id]
      );
    }
  } catch (err) {
    console.error("Timed email error:", err);
  }
};