const verifyApiKeyAndOrigin = (req, res, next) => {
  try {
    // ----- 1️⃣ Check Origin -----
    const origin = req.headers.origin;
    const allowedOrigins = process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',')  // split CSV into array
      : [];

    // console.log("Incoming Origin:", origin);

    // ----- 2️⃣ Check API Key -----
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
      return res.status(200).json({ status: 0, msg: "API key missing." });
    }

    if (apiKey !== process.env.REQUEST_SECRET_KEY) {
      return res.status(200).json({ status: 0, msg: "Unauthorized request." });
    }

    // ----- 2️⃣ Check Origin / Mobile -----
    // if (origin) {
    //   // Browser request
    //   if (!allowedOrigins.includes(origin)) {
    //     return res.status(200).json({
    //       status: 0,
    //       msg: `Unauthorized access: origin not allowed (${origin})`
    //     });
    //   }
    // } else {
    //   // Mobile app request → check custom header
    //   const appId = req.headers['x-app-id'];  // mobile app must send this
    //   if (!appId || appId !== process.env.MOBILE_APP_ID) {
    //     return res.status(200).json({
    //       status: 0,
    //       msg: "Unauthorized access: mobile app not allowed"
    //     });
    //   }
    // }


    // ----- 3️⃣ All checks passed -----
    next();
  } catch (error) {
    return res.status(500).json({
      status: 0,
      msg: "Server error.",
      error: error.message
    });
  }
};

module.exports = { verifyApiKeyAndOrigin };