const express = require("express");
const { db } = require("../../services/db");
const BTK = require("../../API/bitkub");

const calc_strategy = require("../../strategies/calc_strategy");

const cron_bot = require("./cron_bot");
const router = express.Router();

router.use(cron_bot);

router.get("/test", async (req, res) => {
  console.log(req.headers.BTK);

  const data = await BTK.getclosechart("BTC", "1D", 5);
  console.log(data);

  res.send({ status: "ok", message: "test" });
});

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

module.exports = router;
