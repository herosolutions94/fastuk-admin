function isAdmin(req, res, next) {
    if (req.session.admin && req.session.admin.type === 'admin') {
      next(); // Allow access
    } else {
      return res.status(200).send("Access Denied"); // Block access
    }
  }

  
  module.exports = isAdmin;  