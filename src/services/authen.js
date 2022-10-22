var jwt = require("jsonwebtoken");
const secert = "secret-password101";

const authen = (token) => {
  try {
    // console.log(token);
    const decode = jwt.verify(token, secert);
    return { status: "ok", decode };
  } catch (error) {
    console.log(error);
    return { status: "error", message: "Token invalid" };
  }
};

const createToken = (user_id) => {
  const token = jwt.sign({ User_id: user_id }, secert, {
    expiresIn: "1h",
  });
  return token;
};

module.exports = { authen, createToken };
