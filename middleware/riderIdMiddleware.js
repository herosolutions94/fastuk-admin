module.exports = (req, res, next) => {

  res.locals.riderId =
    req.params.rider_id ||
    req.query.rider_id ||
    req.body.rider_id ||
    null;

    console.log('Rider ID set in middleware:', res.locals.riderId);

  next();
};