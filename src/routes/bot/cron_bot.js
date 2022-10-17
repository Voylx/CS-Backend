const express = require("express");
const line = require("../../services/line");

const calc_strategy = require("../../strategies/calc_strategy");

const router = express.Router();

async function store_to_sym_stg_history(syms_action, stg_id) {
  const db = await require("../../services/db_promise");

  try {
    let arg = [];

    Object.keys(syms_action).map((v, i) => {
      arg.push([v, stg_id, syms_action[v]]);
    });

    const [result] = await db.query(
      "INSERT INTO sym_stg_history (Sym, Strategy_id, Side) VALUES ? ",
      [arg]
    );
    // console.log(result);
  } catch (error) {
    console.log(error);
  }
}

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
            return v === "BUY" || v === "SELL";
          })
        )
      : "Something went wrong.",
  };

  console.log(sym_action);

  // test demo data

  sym_test = {
    strategy: "cdc",
    action: { BNB: "SELL", BTC: "BUY", ADA: "SELL" },
  };

  let sql = `
    SELECT selected.Bot_id, selected.Sym, Strategys_Id , Amt_money ,Type, lineUser_id, bitkub.API_key, bitkub.API_secert
    FROM selected 
    LEFT JOIN bot ON selected.Bot_id = bot.bot_id
    LEFT JOIN line on bot.User_id = line.User_id AND bot.Type = 0
    LEFT JOIN bitkub on bot.User_id = bitkub.User_id AND bot.Type = 1
    WHERE Strategys_Id= ? AND (Sym = 
  `;
  const symUse = sym_action;
  syms = Object.keys(symUse.action);
  if (syms.length === 0) return { Action: symUse };

  // store sym_action in sym_stg_history table
  store_to_sym_stg_history(symUse.action, stg_id);

  syms.map((v, i) => {
    if (i < syms.length - 1) sql += "? or Sym =";
    else sql += " ?)";
  });

  //finde bot_id that need to action และ ข้อมูลของbotว่าต้องซื้อขายอะไร เป็นแบบไหน line หรือ trade
  const [result_db_selects] = await db.execute(sql, [stg_id, ...syms]);
  // console.log(result_db_selects);
  if (result_db_selects.length === 0) return { Action: symUse };

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

  console.log(bot_action);
  console.log(
    Object.fromEntries(
      Object.entries(bot_action).map(([k, V]) => {
        const newV = Object.fromEntries(
          Object.entries(V).filter(([key, v]) => {
            return key === "Type" || key === "action";
          })
        );
        console.log(newV);
        return [k, newV];
      })
    )
  );
  const bot_action_filter = Object.fromEntries(
    await Promise.all(
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

        const newV = Object.fromEntries(
          Object.entries(V).filter(([key, v]) => {
            return key === "Type" || key === "action";
          })
        );
        return [k, newV];
      })
    )
  );

  return { Action: symUse, bot_action_f: bot_action_filter, bot_action };
}

router.get("/every1D", async (req, res) => {
  try {
    const cdc1D = await calc_stg(1);
    const ema1D = await calc_stg(3);
    res.send({ cdc1D, ema1D });
  } catch (error) {
    console.log(error);
    res.status(500).send({ status: "error", message: error?.message });
  }
});
router.get("/every4H", async (req, res) => {
  try {
    const cdc4H = await calc_stg(2);
    const ema4H = await calc_stg(4);
    res.send({ cdc4H, ema4H });
  } catch (error) {
    console.log(error);
    res.status(500).send({ status: "error", message: error?.message });
  }
});
router.get("/every1H", async (req, res) => {
  try {
    const ema1H = await calc_stg(5);
    res.send({ ema1H });
  } catch (error) {
    console.log(error);
    res.status(500).send({ status: "error", message: error?.message });
  }
});

module.exports = router;
