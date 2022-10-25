//get api_key from database

module.exports = async function (req, res, next) {
  const db = await require("../services/db_promise");

  const { User_id } = req.body;

  if (!User_id) {
    res.status(400).send({
      status: "error",
      message: "Incomplete information!!!",
    });
    return;
  }

  const sql = "SELECT API_key, API_secert FROM bitkub WHERE User_id = ?";

  try {
    const [result] = await db.execute(sql, [User_id]);
    if (!result[0]) {
      res.status(404).send({
        status: "error",
        message: "API_key or API_secert Not found",
      });
    } else {
      // SAVED API_KEY IN REQUEST BODY
      req.headers.BTK = {
        key: result[0].API_key,
        secert: result[0].API_secert,
      };
      next();
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: "error", message: error.message || error });
    return;
  }
};
