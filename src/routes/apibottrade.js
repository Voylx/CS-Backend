const express = require("express");

const bitkub = require("../API/bitkub");

const router = express.Router();

// add api bitkub
router.post("/add_apibitkub", async (req, res) => {
  const db = await require("../services/db_promise");
  const { User_id, API_key, API_secert } = req.body;

  if (!(User_id && API_key && API_secert)) {
    res.status(400).send({
      status: "error",
      message: "Incomplete information!!!",
    });
    return;
  }
  try {
    // check api to bitkub
    const resp = await bitkub.balances(API_key, API_secert);
    if (resp.error !== 0) {
      res.status(400).send({
        status: "error",
        message: "API_key or API_secert Invalid",
      });
      return;
    }
    const [result] = await db.execute(
      `INSERT IGNORE INTO bitkub (User_id, API_key, API_secert) VALUES (?,?,?)`,
      [User_id, API_key, API_secert]
    );
    if (result.affectedRows === 0) {
      res.status(400).send({
        status: "error",
        message: "You have already added the key.",
      });
    }
    //
    else
      res.send({
        status: "ok",
        message: { affectedRows: result.affectedRows },
      });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: "error", message: error });
  }
});

// delete api bitkub
router.post("/del_apibitkub", (req, res) => {
  res.send({ status: "ok", message: "ยังไม่ได้ทำ" });
});

// update api bitkub
router.post("/update_apibitkub", async (req, res) => {
  const db = await require("../services/db_promise");
  const { User_id, API_key, API_secert } = req.body;
  if (!(User_id && API_key && API_secert)) {
    res.status(400).send({
      status: "error",
      message: "Incomplete information!!!",
    });
    return;
  }
  try {
    // check api to bitkub
    const resp = await bitkub.balances(API_key, API_secert);
    if (resp.error !== 0) {
      res.status(400).send({
        status: "error",
        message: "API_key or API_secert Invalid",
      });
      return;
    }
    const [result] = await db.execute(
      `UPDATE bitkub SET API_key =? ,API_secert =? WHERE User_id=?`,
      [API_key, API_secert, User_id]
    );
    // User have already link API
    if (result.affectedRows === 0) {
      res.status(400).send({
        status: "error",
        message: "You have already added the key.",
      });
    } else
      res.send({
        status: "ok",
        message: { affectedRows: result.affectedRows },
      });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send({ status: "error", message: error.sqlMessage || error });
  }
});

module.exports = router;
