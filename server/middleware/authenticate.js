const { User } = require('../models/user');

const authenticate = (req, res, next) => {
  const token = req.header('x-auth');

  User.findByToken(token)
    .then(user => {
      if (!user) {
        // the following code will force the function to stop executing and jump into catch block
        return Promise.reject();
      }

      req.user = user;
      req.token = token;
      next();
    })
    .catch(() => res.status(401).send());
};

module.exports = { authenticate };
