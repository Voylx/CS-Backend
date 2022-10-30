"use strict";
const express = require("express");
const BTK = require("../../API/bitkub");

const getapikey = require("../../middleware/getapikey");

const calc_strategy = require("../../strategies/calc_strategy");

const cron_bot = require("./cron_bot");
const router = express.Router();

router.use(cron_bot);

//get api_key from database (only methods post)
router.post("*", getapikey);

router.post("/test", async function (req, res) {
  console.log(req.headers.BTK);

  res.send({ status: "success" });
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
  BTK.place_bid(API, sym, amt)
    .then(async (data) => {
      // save to database
      // สมมุติว่า save แล้ว
      //
      const order_info = await BTK.order_info(API, data?.result?.hash);
      res.send({ status: "ok", data, order_info });
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
  BTK.place_ask(API, sym, amt)
    .then(async (data) => {
      console.log(data);
      const order_info = await BTK.order_info(API, data?.result?.hash);

      // save to database
      // สมมุติว่า save แล้ว
      //
      res.send({ status: "ok", data, order_info });
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
  const initMoney = Number(req.query.initMoney) || 1000;
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
      1: ["cdc", "1D", 1],
      2: ["cdc", "240", 6],
      3: ["ema_10_21", "1D", 1],
      4: ["ema_10_21", "240", 6],
    };

    const [stg, tf, multiply_duration] = strategy_name[stgID];
    const new_Duration = durtion * multiply_duration;
    const { data, time } = await BTK.get_close_timechart(sym, tf, new_Duration);
    const { slow, fast } = getEMA[stg](data);
    // console.log({ data, time, slow, fast });
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
    // console.log(results);
    if (results.length < 2) {
      res.send({
        status: "ok",
        message: "backtest",
        data,
        time,
        results,
        profit,
        profit_Percent: 0,
        start: time[0],
      });
      return;
    }

    const last_bth =
      results[results.length - 1]?.Action === "SELL"
        ? results[results.length - 1].balance_bth
        : results[results.length - 2].balance_bth;

    const profit_Percent = (((last_bth - initMoney) / initMoney) * 100).toFixed(
      2
    );

    res.send({
      status: "ok",
      message: "backtest",
      data,
      time,
      results,
      profit,
      profit_Percent,
      start: time[0],
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ status: "error", message: error?.message });
  }
});

module.exports = router;
