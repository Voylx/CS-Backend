const { authen } = require("../services/authen");

module.exports = function (req, res, next) {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const Auth = authen(token);
    if (Auth.status !== "ok") res.send(Auth);
    else {
      req.body.User_id = Auth.decode.User_id;
      next();
    }
  } catch (error) {
    console.log(error);
    res.status(400).send({ status: "error", message: "Token invalid" });
  }
};
