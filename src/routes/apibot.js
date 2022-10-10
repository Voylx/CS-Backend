const express = require("express");
const { v4: uuidv4 } = require("uuid");
const Axios = require("../services/Axios");

const db = require("../services/db");

const authgetuser = require("../middleware/authen_and_getuserid");

const apibottrade = require("./apibottrade");
const check = require("./check");
const bot = require("./bot/bottrade");

const router = express.Router();

router.use("/bot", bot);

// authen and get User_id
router.use(authgetuser);

router.use(apibottrade);
router.use("/check", check);

router.post("/addbot", (req, res) => {
  //add to BOT TABLE
  const { User_id, Type } = req.body;
  const Bot_id = uuidv4();
  db.execute(
    `INSERT INTO bot (Bot_id,User_id,Type) 
    SELECT ?,?,?
    WHERE NOT EXISTS(
      SELECT User_id,Type FROM bot WHERE User_id = ? AND Type = ?)`,
    [Bot_id, User_id, Type, User_id, Type],
    function (err, result) {
      if (err) {
        console.error(err);
        res.status(500).send({ status: "error", message: err.sqlMessage });
      } else if (result.affectedRows === 0) {
        res.status(400).send({
          status: "error",
          message: "Bot has been created",
        });
      } else res.send({ status: "ok", message: "Create Bot Success" });
    }
  );
});
router.post("/delete", (req, res) => {
  //delete Bot in BOT TABLE
});

router.post(
  "/addselected",
  (req, res, next) => {
    //เอาBot_idไปเชคหาBot_Type
    const { Bot_id } = req.body;

    Axios.post(
      "/api/check/bot_by_botid",
      { Bot_id },
      { headers: { Authorization: req.headers.authorization } }
    )
      .then((response) => {
        req.body.botType = response?.data?.bot?.Type;
        next();
      })
      .catch((error) => {
        res.status(500).send(error?.response?.data);
      });
  },
  (req, res, next) => {
    // คัดออกถ้าข้อมูลไม่ครบ
    const { Sym, Strategys_Id, botType, Amt_money } = req.body;
    if (botType) {
      if (!(Sym && Strategys_Id && Amt_money)) {
        res.status(400).send({
          status: "error",
          message: "Incomplete request ",
        });
        return;
      }
    } else {
      req.body.Amt_money = null;
      if (!(Sym && Strategys_Id)) {
        res.status(400).send({
          status: "error",
          message: "Incomplete request ",
        });
        return;
      }
    }
    next();
  },
  (req, res) => {
    //เก็บข้อมูลในDatabase
    const { Bot_id, Sym, Strategys_Id, Amt_money } = req.body;
    db.execute(
      "INSERT IGNORE INTO selected (Bot_id, Sym, Strategys_Id, Amt_money) VALUES (?,?,?,?)",
      [Bot_id, Sym, Strategys_Id, Amt_money],
      function (err, result) {
        if (err) {
          console.error(err);
          res.status(500).send({ status: "error", message: err.sqlMessage });
          return;
        }
        res.status(200).send({
          status: "success",
          result,
        });
      }
    );
    // res.send(req.body);
  }
);

router.post("/delselected", (req, res) => {
  const { Bot_id, Sym, Strategys_Id } = req.body;
  if (!(Bot_id && Sym && Strategys_Id)) {
    res.status(400).send({
      status: "error",
      message: "Incomplete request ",
    });
    return;
  }
  db.execute(
    "DELETE FROM selected WHERE Bot_id = ? AND Sym = ? AND Strategys_Id = ?",
    [Bot_id, Sym, Strategys_Id],
    function (err, results) {
      if (err) {
        console.error(err);
        res.status(500).send({ status: "error", message: err.sqlMessage });
      }
      res.status(200).send({
        status: "success",
        results,
      });
    }
  );
});

router.post("/addfav", (req, res) => {
  const { Bot_id, Sym, Strategys_Id } = req.body;
  if (!(Bot_id && Sym && Strategys_Id)) {
    res.status(400).send({
      status: "error",
      message: "Incomplete request ",
    });
    return;
  }
  db.execute(
    "INSERT IGNORE INTO fav (Bot_id, Sym, Strategys_Id) VALUES (?, ?, ?)",
    [Bot_id, Sym, Strategys_Id],
    function (err, results) {
      if (err) {
        console.error(err);
        res.status(500).send({ status: "error", message: err.sqlMessage });
        return;
      }
      if (results.affectedRows === 0) {
        res.status(500).send({
          message: "Can't Add Favorite",
          results: results.affectedRows,
        });
        return;
      }
      res.status(200).send({
        status: "success",
        message: "Added new Favorite",
        results,
      });
    }
  );
});

router.post("/delfav", (req, res) => {
  const { Bot_id, Sym, Strategys_Id } = req.body;
  if (!(Bot_id && Sym && Strategys_Id)) {
    res.status(400).send({
      status: "error",
      message: "Incomplete request ",
    });
    return;
  }
  db.execute(
    "DELETE FROM fav WHERE Bot_id = ? AND Sym = ? AND Strategys_Id = ?",
    [Bot_id, Sym, Strategys_Id],
    function (err, results) {
      if (err) {
        console.error(err);
        res.status(500).send({ status: "error", message: err.sqlMessage });
        return;
      }
      if (results.affectedRows === 0) {
        res.status(500).send({
          message: "Can't Delete Favorite",
          results: results.affectedRows,
        });
        return;
      }
      res.status(200).send({
        status: "success",
        message: "Delete Favorite",
        affectedRows: results.affectedRows,
      });
    }
  );
});

router.post("/getfav", (req, res) => {
  const { Bot_id } = req.body;
  if (!Bot_id) {
    res.status(400).send({
      status: "error",
      message: "Incomplete request ",
    });
    return;
  }
  db.execute(
    "SELECT * FROM fav WHERE Bot_id = ?",
    [Bot_id],
    function (err, results) {
      if (err) {
        console.error(err);
        res.status(500).send({ status: "error", message: err.sqlMessage });
        return;
      }
      console.log(results);
      const rett = [];
      results.map(({ Sym, Strategys_Id }, i) => {
        rett.push({ Sym, Strategys_Id });
      });
      console.log(rett);

      res.send({
        status: "success",
        Bot_id,
        fav: rett,
      });
    }
  );
});

router.post("/getsymstgboxdata", (req, res) => {
  const { Bot_id } = req.body;
  if (!Bot_id) {
    res.status(400).send({
      status: "error",
      message: "Incomplete request ",
    });
    return;
  }
  const sql = `
    SELECT symbols.Sym, strategies.Strategy_id, strategies.Strategy_name, 
    CASE WHEN fav.Fav_id IS NOT NULL THEN 1 END as isFav
    FROM symbols
    JOIN strategies
    LEFT JOIN 
    fav ON symbols.Sym = fav.Sym AND 
    strategies.Strategy_id = fav.Strategys_Id AND
    fav.Bot_id = ?;
  `;

  db.execute(sql, [Bot_id], (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).send({ status: "error", message: err.sqlMessage });
      return;
    }
    res.send({
      status: "success",
      data: results,
    });
  });
});

module.exports = router;
