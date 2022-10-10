const express = require("express");

const db = require("../services/db");
const bitkub = require("../API/bitkub");

const router = express.Router();

// add api bitkub
router.post("/add_apibitkub", async (req, res) => {
  const { User_id, API_key, API_secert } = req.body;

  if (!(User_id && API_key && API_secert)) {
    res.status(400).send({
      status: "error",
      message: "Incomplete information!!!",
    });
    return;
  }

  // check api to bitkub
  const result = await bitkub.balances(API_key, API_secert);
  if (result.error !== 0) {
    res.status(400).send({
      status: "error",
      message: "API_key or API_secert Invalid",
    });
    return;
  }

  db.execute(
    `INSERT IGNORE INTO bitkub (User_id, API_key, API_secert) VALUES (?,?,?)`,
    [User_id, API_key, API_secert],
    function (err, result) {
      //Check SQL Error
      if (err) {
        console.error(err);
        res.status(500).send({ status: "error", message: err });
      }
      // User have already link API
      else if (result.affectedRows === 0) {
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
    }
  );
});

// delete api bitkub
router.post("/del_apibitkub", (req, res) => {
  res.send({ status: "ok", message: "ยังไม่ได้ทำ" });
});

// update api bitkub
router.post("/update_apibitkub", async (req, res) => {
  const { User_id, API_key, API_secert } = req.body;
  if (!(User_id && API_key && API_secert)) {
    res.status(400).send({
      status: "error",
      message: "Incomplete information!!!",
    });
    return;
  }

  // check api to bitkub
  const result = await bitkub.balances(API_key, API_secert);
  if (result.error !== 0) {
    res.status(400).send({
      status: "error",
      message: "API_key or API_secert Invalid",
    });
    return;
  }

  db.execute(
    `UPDATE bitkub SET API_key =? ,API_secert =? WHERE User_id=?`,
    [API_key, API_secert, User_id],
    function (err, result) {
      //Check SQL Error
      if (err) {
        console.error(err);
        res.status(500).send({ status: "error", message: err.sqlMessage });
      }
      // User have already link API
      else if (result.affectedRows === 0) {
        res.status(400).send({
          status: "error",
          message: "You have already added the key.",
        });
      } else
        res.send({
          status: "ok",
          message: { affectedRows: result.affectedRows },
        });
    }
  );
});

module.exports = router;
