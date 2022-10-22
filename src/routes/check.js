const express = require("express");

const router = express.Router();

//check

router.post("/link_apibitkub", async (req, res) => {
  const db = await require("../services/db_promise");
  const { User_id } = req.body;

  try {
    const [results] = await db.execute(
      "SELECT COUNT(API_KEY) FROM bitkub Where  user_id =? ",
      [User_id]
    );
    if (results.length === 0) {
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
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send({ status: "error", message: error.sqlMessage || error });
  }
});

router.post("/link_line", async (req, res) => {
  const db = await require("../services/db_promise");
  const { User_id } = req.body;

  try {
    const [results] = await db.execute(
      "SELECT COUNT(LineUser_id) FROM line Where  user_id =? ",
      [User_id]
    );
    if (results.length === 0) {
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
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send({ status: "error", message: error.sqlMessage || error });
  }
});

router.post("/havebot", async (req, res) => {
  const db = await require("../services/db_promise");

  const { User_id, Type } = req.body;
  // check type in
  if (Type === undefined) {
    res.status(400).send({
      status: "error",
      message: "Incomplete request (Type)",
    });
    return;
  }

  try {
    const [results] = await db.execute(
      "SELECT * FROM bot Where user_id = ? and type = ?",
      [User_id, Type]
    );
    if (results.length === 0) {
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
  } catch (err) {
    console.error(err);
    res.status(500).send({ status: "error", message: err.message });
  }
});

router.post("/bot_by_botid", async (req, res) => {
  const db = await require("../services/db_promise");
  const { User_id, Bot_id } = req.body;
  // check type bot
  if (!Bot_id) {
    res.status(400).send({
      status: "error",
      message: "Incomplete request (Bot_id)",
    });
    return;
  }

  try {
    const [results] = await db.execute(
      "SELECT * FROM bot WHERE User_id =? and Bot_id =?",
      [User_id, Bot_id]
    );
    // console.log(results);
    if (results.length === 0) {
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
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: "error", message: error });
  }
});

router.post("/isSelectedSym", async (req, res) => {
  const db = await require("../services/db_promise");
  const { User_id, Bot_id, Sym } = req.body;
  // check type bot
  if (!Bot_id || !Sym) {
    res.status(400).send({
      status: "error",
      message: "Incomplete request (Bot_id)",
    });
    return;
  }

  try {
    const sql = `
    SELECT * FROM selected WHERE Bot_id = ? AND Sym = ? 
    `;

    const [selected] = await db.execute(sql, [Bot_id, Sym]);
    const data = selected[0];

    res.send({ status: "success", selected: data || null });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: "error", message: error });
  }
});

module.exports = router;
