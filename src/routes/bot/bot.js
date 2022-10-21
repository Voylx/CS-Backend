"use strict";
const express = require("express");
const { db } = require("../../services/db");
const BTK = require("../../API/bitkub");

const calc_strategy = require("../../strategies/calc_strategy");

const cron_bot = require("./cron_bot");
const router = express.Router();

router.use(cron_bot);

//get api_key from database (only methods post)
router.post("/", function (req, res, next) {
  const { User_id } = req.body;

  if (!User_id) {
    res.status(400).send({
      status: "error",
      message: "Incomplete information!!!",
    });
    return;
  }

  const sql = "SELECT API_key, API_secert FROM bitkub WHERE User_id = ?";
  db.execute(sql, [User_id], (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send({ status: "error", message: err.message });
      return;
    }
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
  });
});

router.post("/place_bid", (req, res) => {
  const { sym, amt } = req.body;

  if (!(sym && amt)) {
    res.status(400).send({
      status: "error",
      message: "Incomplete information!!!",
    });
    return;
  }

  const API = req.headers.BTK;
  // const sym = "THB_XLM";

  // const amt = 10;
  BTK.place_bid(API, "THB_" + sym, amt)
    .then((data) => {
      // save to database
      // สมมุติว่า save แล้ว
      //
      res.send({ status: "ok", data });
    })
    .catch((err) => {
      console.log("error:", err);
      res.status(501).send({ status: "error", message: err });
    });
});

router.post("/place_ask", (req, res) => {
  const { sym, amt } = req.body;

  if (!(sym && amt)) {
    res.status(400).send({
      status: "error",
      message: "Incomplete information!!!",
    });
    return;
  }

  const API = req.headers.BTK;
  // const sym = "THB_XLM";

  // const amt = 10;
  BTK.place_ask(API, "THB_" + sym, amt)
    .then((data) => {
      console.log(data);

      // save to database
      // สมมุติว่า save แล้ว
      //
      res.send({ status: "ok", data });
    })
    .catch((err) => {
      console.log("error:", err);
      res.status(501).send({ status: "error", message: err });
    });
});

router.get("/getsymaction", async (req, res) => {
  const { stg } = req.query;
  if (!stg) {
    res.status(400).send({
      status: "error",
      message: "Incomplete request (stg is required)",
    });
    return;
  }

  console.log(stg);

  const response = await calc_strategy(stg);
  // const response = await calc_strategy("ema_10_21");

  //filter Action
  const sym_action = {
    strategy: response.strategy,
    action: response.result
      ? Object.fromEntries(
          Object.entries(response.result).filter(([k, v]) => {
            return v === "BUY🟢" || v === "SELL🔴";
          })
        )
      : "Something went wrong.",
  };

  console.log(sym_action);
  res.send({ status: "ok", sym_action });
});

router.get("/backtest", async (req, res) => {
  const { stgID, sym, durtion } = req.query;
  if (!stgID || !sym || !durtion) {
    res.status(400).send({
      status: "error",
      message: "Incomplete request (stg,sym,duration is required)",
    });
    return;
  }
  function unixTime(unixtime) {
    if (unixtime) {
      var u = new Date(unixtime * 1000);

      return (
        u.getUTCFullYear() +
        "-" +
        ("0" + (u.getMonth() + 1)).slice(-2) +
        "-" +
        ("0" + u.getDate()).slice(-2) +
        " : " +
        ("0" + u.getHours()).slice(-2) +
        ":" +
        ("0" + u.getMinutes()).slice(-2) +
        ":" +
        ("0" + u.getSeconds()).slice(-2)
      );
    }
  }

  try {
    const { getEMA } = require("../../strategies/emacross");
    const strategy_name = {
      1: ["cdc", "1D"],
      2: ["cdc", "240"],
      3: ["ema_10_21", "1D"],
      4: ["ema_10_21", "240"],
      5: ["ema_10_21", "60"],
    };

    const [stg, tf] = strategy_name[stgID];
    // const data = await BTK.getclosechart(sym, tf, 99);
    const { data, time } = await BTK.get_close_timechart(sym, tf, 700);
    const { slow, fast } = getEMA[stg](data);
    // console.log({ data, time, slow, fast });
    const initMoney = 1000;
    let balance_bth = initMoney;
    let balance_coin = 0;

    const results = [];
    const profit = [initMoney];

    function handleBuy(data, time) {
      balance_coin = balance_bth / data;
      balance_bth = 0;
      results.push({
        Action: "BUY",
        price: data,
        time: unixTime(time),
        balance_bth,
        balance_coin,
      });
    }
    function handleSell(data, time) {
      balance_bth = balance_coin * data;
      profit.push(balance_bth);
      balance_coin = 0;
      results.push({
        Action: "SELL",
        price: data,
        time: unixTime(time),
        balance_bth,
        balance_coin,
      });
    }

    for (let i = 0; i < data.length; i++) {
      if (!fast[i - 1] || !slow[i - 1]) continue;

      if (fast[i] > slow[i] && fast[i - 1] < slow[i - 1]) {
        handleBuy(data[i], time[i]);
        continue;
      }
      if (fast[i] < slow[i] && fast[i - 1] > slow[i - 1]) {
        if (results.length > 0) handleSell(data[i], time[i]);
        continue;
      }
    }

    const profit_Percent = ((balance_bth - initMoney) / initMoney) * 100;

    res.send({
      status: "ok",
      message: "backtest",
      results,
      profit,
      profit_Percent,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ status: "error", message: error?.message });
  }
});

module.exports = router;
