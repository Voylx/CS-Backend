const express = require("express");
const { db } = require("../../services/db");
const line = require("../../services/line");

const BTK = require("../../API/bitkub");

const calc_strategy = require("../../strategies/calc_strategy");

const router = express.Router();

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

async function calc_stg(stg_id) {
  const db = await require("../../services/db_promise");

  const response = await calc_strategy(stg_id);
  const strategy_name = {
    1: "CDC-TF1D",
    2: "CDC-TF4H",
    3: "EMA-10-21-TF1D",
    4: "EMA-10-21-TF4H",
    5: "EMA-10-21-TF1H",
  };

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

  // test demo data

  sym_test = {
    strategy: "cdc",
    action: { BNB: "SELL🔴", BTC: "BUY🟢", ADA: "SELL🔴" },
  };

  let sql = `
    SELECT selected.Bot_id, selected.Sym, Strategys_Id , Amt_money ,Type, lineUser_id, bitkub.API_key, bitkub.API_secert
    FROM selected 
    LEFT JOIN bot ON selected.Bot_id = bot.bot_id
    LEFT JOIN line on bot.User_id = line.User_id AND bot.Type = 0
    LEFT JOIN bitkub on bot.User_id = bitkub.User_id AND bot.Type = 1
    WHERE Strategys_Id= ? AND (Sym = 
  `;
  const symUse = sym_test;
  syms = Object.keys(symUse.action);
  if (syms.length === 0) return;
  syms.map((v, i) => {
    if (i < syms.length - 1) sql += "? or Sym =";
    else sql += " ?)";
  });

  //finde bot_id that need to action และ ข้อมูลของbotว่าต้องซื้อขายอะไร เป็นแบบไหน line หรือ trade
  const [result_db_selects] = await db.execute(sql, [stg_id, ...syms]);
  // console.log(result_db_selects);
  if (result_db_selects.length === 0) {
    // res.send();
    return;
  }
  const bot_action = {};
  result_db_selects.map((v, i) => {
    !bot_action[v.Bot_id] && Object.assign(bot_action, { [v.Bot_id]: {} });
    // add Type,API_key,lineUser_id to obj
    bot_action[v.Bot_id]["Type"] = v.Type;
    if (v.Type) {
      bot_action[v.Bot_id]["API_key"] = v.API_key;
      bot_action[v.Bot_id]["API_secert"] = v.API_secert;
    } else {
      bot_action[v.Bot_id]["lineUser_id"] = v.lineUser_id;
    }

    !bot_action[v.Bot_id].action ? (bot_action[v.Bot_id].action = []) : null;
    //add action to obj
    bot_action[v.Bot_id].action.push({
      Sym: v.Sym,
      Action: symUse.action[v.Sym],
      Amt_money: v.Amt_money,
    });
  });

  Object.entries(bot_action).map(async ([k, V]) => {
    if (V.Type) {
      // ACTION Trade
    } else {
      // ACTION Line
      const pre_Text = V.action.map((v) => {
        return v.Sym + " : " + v.Action;
      });
      if (!V.lineUser_id) return;
      const resp = await line.push(
        V.lineUser_id,
        "Strategy : " + strategy_name[stg_id] + "\n" + pre_Text.join("\n")
      );
      console.log(resp);
    }
  });
  return bot_action;
}

router.get("/every1D", async (req, res) => {
  try {
    const cdc1D = await calc_stg(1);
    const ema1D = await calc_stg(3);
    res.send({ cdc1D: cdc1D || null, ema1D: ema1D || null });
  } catch (error) {
    console.log(error);
    res.status(500).send({ status: "error", message: error?.message });
  }
});

module.exports = router;
