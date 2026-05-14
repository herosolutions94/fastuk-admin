// cron/index.js

const cron = require("node-cron");
const axios = require("axios");

// Runs on 1st day of month at 12:05 AM
cron.schedule("5 0 1 * *", async () => {

  try {

    await axios.get(
      "https://yourdomain.com/cron/clear-driver-earnings"
    );

    console.log("1st cron executed");

  } catch (error) {

    console.log("1st cron error", error.message);
  }
});

// Runs on 15th day of month at 12:05 AM
cron.schedule("5 0 15 * *", async () => {

  try {

    await axios.get(
      "https://yourdomain.com/cron/clear-driver-earnings"
    );

    console.log("15th cron executed");

  } catch (error) {

    console.log("15th cron error", error.message);
  }
});