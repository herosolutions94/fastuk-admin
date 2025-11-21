// // utils/goCardless.js
// const gocardless = require("gocardless-nodejs");

// const client = gocardless({
//   access_token: process.env.GOCARDLESS_ACCESS_TOKEN,
//   environment: "sandbox", // 👈 just a string in v6
// });

// console.log("GC Token prefix:", process.env.GOCARDLESS_ACCESS_TOKEN?.slice(0, 8));
// console.log("GC Environment: sandbox");

// module.exports = client;



const gocardless = require('gocardless-nodejs');
const constants = require('gocardless-nodejs/constants');
const env =
  process.env.GC_ENVIRONMENT === 'live'
    ? constants.Environments.Live
    : constants.Environments.Sandbox;
const client = gocardless(process.env.GC_ACCESS_TOKEN, env);
module.exports = client;
