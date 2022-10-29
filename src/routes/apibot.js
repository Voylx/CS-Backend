const express = require("express");
const { v4: uuidv4 } = require("uuid");

const Axios = require("../services/Axios");
const bitkub = require("../API/bitkub");

const authgetuser = require("../middleware/authen_and_getuserid");

const apibottrade = require("./apibottrade");
const check = require("./check");
const bot = require("./bot/bot");

const router = express.Router();

router.use("/bot", bot);

// authen and get User_id
router.use(authgetuser);

router.use(apibottrade);
router.use("/check", check);

router.post("/addbot", async (req, res) => {
  const db = await require("../services/db_promise");
  //add to BOT TABLE
  const { User_id, Type } = req.body;
  const Bot_id = uuidv4();
  const sql = `
      INSERT INTO bot (Bot_id,User_id,Type) 
        SELECT ?,?,?
        WHERE NOT EXISTS(
        SELECT User_id,Type FROM bot WHERE User_id = ? AND Type = ?)  
    `;
  try {
    //prettier-ignore
    const [result] = await db.execute(sql, [Bot_id,User_id,Type,User_id,Type]);
    if (result.affectedRows === 0) {
      res.status(400).send({
        status: "error",
        message: "Bot has been created",
      });
    } else res.send({ status: "ok", message: "Create Bot Success" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: "error", message: err.sqlMessage });
  }
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
  async (req, res) => {
    const db = await require("../services/db_promise");

    //เก็บข้อมูลในDatabase
    const { Bot_id, Sym, Strategys_Id, Amt_money } = req.body;
    try {
      const [result_insertSelected] = await db.execute(
        "INSERT IGNORE INTO selected (Bot_id, Sym, Strategys_Id, Amt_money) VALUES (?,?,?,?)",
        [Bot_id, Sym, Strategys_Id, Amt_money]
      );
      if (result_insertSelected.affectedRows === 0) {
        res.status(500).send({
          status: "error",
          message:
            "1 symbol can choose 1 strategy only.\n1 เหรียญ เลือกได้ 1 กลยุทธ์ เท่านั้น",
        });
        return;
      }

      res.status(200).send({
        status: "success",
        result: result_insertSelected,
      });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .send({ status: "error", message: error.sqlMessage || error });
      return;
    }
  }
);

router.post("/delselected", async (req, res) => {
  const db = await require("../services/db_promise");
  const { Bot_id, Sym, Strategys_Id } = req.body;
  if (!(Bot_id && Sym && Strategys_Id)) {
    res.status(400).send({
      status: "error",
      message: "Incomplete request ",
    });
    return;
  }

  try {
    const [results] = await db.execute(
      "DELETE FROM selected WHERE Bot_id = ? AND Sym = ? AND Strategys_Id = ?",
      [Bot_id, Sym, Strategys_Id]
    );
    if (results.affectedRows === 0) {
      res.status(500).send({
        status: "error",
        message: "Can not delete selected",
        results: results,
      });
      return;
    }
    res.status(200).send({
      status: "success",
      results,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send({ status: "error", message: error?.sqlMessage ?? error });
  }
});

router.post("/addfav", async (req, res) => {
  const db = await require("../services/db_promise");
  const { Bot_id, Sym, Strategys_Id } = req.body;
  if (!(Bot_id && Sym && Strategys_Id)) {
    res.status(400).send({
      status: "error",
      message: "Incomplete request ",
    });
    return;
  }
  try {
    const [results] = await db.execute(
      "INSERT IGNORE INTO fav (Bot_id, Sym, Strategys_Id) VALUES (?, ?, ?)",
      [Bot_id, Sym, Strategys_Id]
    );
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
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: "error", message: error.sqlMessage });
    return;
  }
});

router.post("/delfav", async (req, res) => {
  const db = await require("../services/db_promise");
  const { Bot_id, Sym, Strategys_Id } = req.body;
  if (!(Bot_id && Sym && Strategys_Id)) {
    res.status(400).send({
      status: "error",
      message: "Incomplete request ",
    });
    return;
  }

  try {
    const [results] = await db.execute(
      "DELETE FROM fav WHERE Bot_id = ? AND Sym = ? AND Strategys_Id = ?",
      [Bot_id, Sym, Strategys_Id]
    );
    if (results.affectedRows === 0) {
      res.status(500).send({
        message: "Can't Delete Favorite",
        results: results?.affectedRows ?? results,
      });
      return;
    }
    res.status(200).send({
      status: "success",
      message: "Delete Favorite",
      affectedRows: results.affectedRows,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send({ status: "error", message: error.sqlMessage || error });
  }
});

router.post("/getfav", async (req, res) => {
  const db = await require("../services/db_promise");
  const { Bot_id } = req.body;
  if (!Bot_id) {
    res.status(400).send({
      status: "error",
      message: "Incomplete request ",
    });
    return;
  }

  try {
    const [results] = await db.execute("SELECT * FROM fav WHERE Bot_id = ?", [
      Bot_id,
    ]);
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
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: "error", message: error.sqlMessage });
  }
});

router.post("/getsymstgboxdata", async (req, res) => {
  const db = await require("../services/db_promise");
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
      CASE WHEN fav.Fav_id IS NOT NULL THEN 1 END as isFav,
      CASE WHEN selected.Selected_id IS NOT NULL THEN 1 END as isSelected,
      s3.Side,UNIX_TIMESTAMP(s3.Timestamp)AS Timestamp
      
      FROM symbols
      JOIN strategies
      LEFT JOIN 
      fav ON symbols.Sym = fav.Sym AND 
      strategies.Strategy_id = fav.Strategys_Id AND
      fav.Bot_id = ?
      LEFT JOIN
      selected on selected.Bot_id = ? AND 
      symbols.Sym = selected.Sym AND 
      strategies.Strategy_id = selected.Strategys_Id
      LEFT JOIN
      (
          SELECT s1.* FROM sym_stg_history s1
      INNER JOIN
      (
      SELECT Sym,Strategy_id,max(Timestamp) as mts FROM sym_stg_history 
      GROUP BY Sym,Strategy_id
      ) s2 ON s2.Sym = s1.Sym  AND s2.Strategy_id = s1.Strategy_id  AND s1.Timestamp = mts
      )s3 ON symbols.Sym = s3.Sym AND
      strategies.Strategy_id = s3.Strategy_id;  
  `;
  try {
    const [results] = await db.execute(sql, [Bot_id, Bot_id]);
    res.send({
      status: "success",
      data: results,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send({ status: "error", message: error.sqlMessage || error });
    return;
  }
});

router.post("/getusernames", async (req, res) => {
  const db = await require("../services/db_promise");

  const { User_id } = req.body;
  if (!User_id) {
    res.status(400).send({
      status: "error",
      message: "Incomplete request ",
    });
    return;
  }
  try {
    const [user] = await db.execute(
      "SELECT username FROM users WHERE User_id = ?",
      [User_id]
    );
    res.send({
      status: "success",
      username: user[0].username,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: "error", message: error.sqlMessage });
  }
});

router.post("/getsymstgboxdata_onlysym", async (req, res) => {
  const db = await require("../services/db_promise");
  const { Bot_id, Sym } = req.body;
  if (!Bot_id || !Sym) {
    res.status(400).send({
      status: "error",
      message: "Incomplete request ",
    });
    return;
  }

  const sql = `
    SELECT symbols.Sym, strategies.Strategy_id, strategies.Strategy_name, 
      CASE WHEN fav.Fav_id IS NOT NULL THEN 1 END as isFav,
      CASE WHEN selected.Selected_id IS NOT NULL THEN 1 END as isSelected,
      s3.Side,UNIX_TIMESTAMP(s3.Timestamp)AS Timestamp
      
      FROM symbols
      JOIN strategies
      LEFT JOIN 
      fav ON symbols.Sym = fav.Sym AND 
      strategies.Strategy_id = fav.Strategys_Id AND
      fav.Bot_id = ?
      LEFT JOIN
      selected on selected.Bot_id = ? AND 
      symbols.Sym = selected.Sym AND 
      strategies.Strategy_id = selected.Strategys_Id
      LEFT JOIN
      (
          SELECT s1.* FROM sym_stg_history s1
      INNER JOIN
      (
      SELECT Sym,Strategy_id,max(Timestamp) as mts FROM sym_stg_history 
      GROUP BY Sym,Strategy_id
      ) s2 ON s2.Sym = s1.Sym  AND s2.Strategy_id = s1.Strategy_id  AND s1.Timestamp = mts
      )s3 ON symbols.Sym = s3.Sym AND
      strategies.Strategy_id = s3.Strategy_id
      WHERE symbols.Sym = ?;  
  `;
  try {
    const [results] = await db.execute(sql, [Bot_id, Bot_id, Sym]);
    res.send({
      status: "success",
      data: results,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send({ status: "error", message: error.sqlMessage || error });
    return;
  }
});

router.post("/getactionhistory", async (req, res) => {
  const db = await require("../services/db_promise");

  const { Bot_id } = req.body;
  if (!Bot_id) {
    res.status(400).send({
      status: "error",
      message: "Incomplete request ",
    });
    return;
  }

  const sql = `SELECT Sym, UNIX_TIMESTAMP(Timestamp) as ts , Side, Amt_money, Amt_coins FROM history WHERE Bot_id = ? ORDER BY ts DESC`;

  try {
    const [his] = await db.execute(sql, [Bot_id]);
    res.send({
      status: "success",
      history: his,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send({ status: "error", message: error.sqlMessage || error });
    return;
  }
});

module.exports = router;
