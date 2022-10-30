const express = require("express");
const Axios = require("../services/Axios");
const bitkub = require("../API/bitkub");

const router = express.Router();

router.get("/test", function (req, res) {
  res.send("test /api/test get");
});

router.get("/tickers", async (req, res) => {
  try {
    const getsym = await Axios.get("/symbols");
    const sym = getsym?.data?.symbols;

    const data = await bitkub.getticker();

    // console.log(sym);
    const results = {};

    Object.entries(data).map(([key, Value]) => {
      const V = Object.fromEntries(
        Object.entries(Value).filter(([k, v]) => {
          return k === "last" || k === "percentChange";
        })
      );
      // console.log(k.substring(4));
      if (sym.includes(key.substring(4))) results[key.substring(4)] = V;
    });

    res.send({
      status: "success",
      results,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ status: "error", message: error });
  }
});

router.get("/getsymstghistory", async (req, res) => {
  const db = await require("../services/db_promise");

  const { Sym, Strategy_id } = req.query;
  if (!Sym || !Strategy_id) {
    res.status(400).send({
      status: "error",
      message: "Incomplete request ",
    });
    return;
  }
  try {
    const sql = `
      SELECT Sym,sym_stg_history.Strategy_id,Strategy_name,Side,UNIX_TIMESTAMP(Timestamp)AS Timestamp FROM sym_stg_history 
      JOIN strategies ON sym_stg_history.Strategy_id = strategies.Strategy_id
      WHERE Sym = ? AND strategies.Strategy_id =?
    `;
    const [data] = await db.execute(sql, [Sym, Strategy_id]);
    // ถ้ามีhistoryแล้ว
    if (data.length > 0) {
      const historys = data.map((V) => {
        const newV = Object.fromEntries(
          Object.entries(V).filter(([k, v]) => {
            return k === "Side" || k === "Timestamp";
          })
        );
        return newV;
      });

      res.send({
        status: "success",
        historys: historys,
        Sym,
        Strategy_name: data[0].Strategy_name,
        Strategy_id: Strategy_id,
      });
    }
    // ถ้ายังไม่มีhistory
    else {
      const [result] = await db.execute(
        "SELECT Strategy_name FROM strategies WHERE Strategy_id = ?",
        [Strategy_id]
      );

      res.send({
        status: "success",
        historys: [],
        Sym,
        Strategy_name: result[0]?.Strategy_name,
        Strategy_id: Strategy_id,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: "error", message: error.sqlMessage });
  }
});
module.exports = router;
