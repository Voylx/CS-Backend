const express = require("express");

const db = require("../services/db");
const bitkub = require("../API/bitkub");

const router = express.Router();

//check

router.post("/link_apibitkub", (req, res) => {
  const { User_id } = req.body;
  db.execute(
    "SELECT COUNT(API_KEY) FROM bitkub Where  user_id =? ",
    [User_id],
    function (err, results) {
      //Check SQL Error
      if (err) {
        console.error(err);
        res.status(500).send({ status: "error", message: err.sqlMessage });
      } else if (results.length === 0) {
        res.status(404).send({
          status: "err",
          message: "api Not Found",
        });
      } else {
        // console.log(results[0]["COUNT(API_KEY)"]);
        res.send({
          status: "ok",
          linkAPI: Boolean(results[0]["COUNT(API_KEY)"]),
        });
      }
    }
  );
});

router.post("/link_line", (req, res) => {
  const { User_id } = req.body;
  db.execute(
    "SELECT COUNT(LineUser_id) FROM line Where  user_id =? ",
    [User_id],
    function (err, results) {
      //Check SQL Error
      if (err) {
        console.error(err);
        res.status(500).send({ status: "error", message: err.sqlMessage });
      } else if (results.length === 0) {
        res.status(404).send({
          status: "err",
          message: "LineUser Not Found",
        });
      } else {
        // console.log(results[0]);
        res.send({
          status: "ok",
          linkLine: Boolean(results[0]["COUNT(LineUser_id)"]),
        });
      }
    }
  );
});

router.post("/havebot", (req, res) => {
  const { User_id, Type } = req.body;
  // check type in
  if (Type === undefined) {
    res.status(400).send({
      status: "error",
      message: "Incomplete request (Type)",
    });
    return;
  }
  db.execute(
    "SELECT * FROM bot Where user_id = ? and type = ?",
    [User_id, Type],
    function (err, results) {
      //Check SQL Error
      if (err) {
        console.error(err);
        res.status(500).send({ status: "error", message: err.sqlMessage });
      } else if (results.length === 0) {
        res.send({
          status: "ok",
          bot: null,
        });
      } else {
        res.send({
          status: "ok",
          bot: results[0],
        });
      }
    }
  );
});

router.post("/bot_by_botid", (req, res) => {
  const { User_id, Bot_id } = req.body;
  // check type bot
  if (!Bot_id) {
    res.status(400).send({
      status: "error",
      message: "Incomplete request (Bot_id)",
    });
    return;
  }
  db.execute(
    "SELECT * FROM bot WHERE User_id =? and Bot_id =?",
    [User_id, Bot_id],
    function (err, results) {
      //Check SQL Error
      if (err) {
        console.error(err);
        res.status(500).send({ status: "error", message: err.sqlMessage });
      } else if (results.length === 0) {
        res.status(404).send({
          status: "err",
          message: "Bot_id Not Found",
        });
      } else {
        res.send({
          status: "ok",
          bot: results[0],
        });
      }
    }
  );
});

module.exports = router;
