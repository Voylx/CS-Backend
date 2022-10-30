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

async function store_to_history(bot_id, sym, side, bitkub_response) {
  const db = await require("../../services/db_promise");

  console.log("31", bitkub_response.result);
  const { ts, amt, rec } = bitkub_response.result;

  let amt_money, amt_coins;

  if (side === "BUY") {
    amt_money = amt;
    amt_coins = rec;
  }
  if (side == "SELL") {
    amt_money = rec;
    amt_coins = amt;
  }

  try {
    const sql = `
    INSERT INTO history
      ( Bot_id, Sym, Timestamp, Side, Amt_money, Amt_coins)
      VALUES
      (?, ?, FROM_UNIXTIME(?), ?, ?, ?);
    `;

    const [result] = await db.query(sql, [
      bot_id,
      sym,
      ts,
      side,
      amt_money,
      amt_coins,
    ]);
    return result;
  } catch (error) {
    console.log(error);
    return error;
  }
}

async function handleActionLine(V, stg_id) {
  `
    {
      Type: 0,
      lineUser_id: 'Ucc2430ec115ca5e9a40a9116819346f9',
      action: [ { Sym: 'ADA', Action: 'SELL', Amt_money: null } ]
    }
    
  `;
  const strategy_name = {
    1: "CDC-TF1D",
    2: "CDC-TF4H",
    3: "EMA-10-21-TF1D",
    4: "EMA-10-21-TF4H",
    5: "EMA-10-21-TF1H",
  };
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

async function handleActionTrade(data, bot_id) {
  `
  data : {
    Type: 1,
    API_key: null,
    API_secert: null,
    action: [
      {
        Sym: 'BTC',
        Action: 'BUY',
        Amt_money: 200,
        lastActionTime: null,
        lastAction: null,
        lastAmtMoney: null,
        lastAmtCoins: null
      },
      {
        Sym: 'BNB',
        Action: 'SELL',
        Amt_money: 300,
        lastActionTime: null,
        lastAction: null,
        lastAmtMoney: null,
        lastAmtCoins: null
      }
    ]
  }
  `;
  const BTK = require("../../API/bitkub");
  const client_API = { key: data.API_key, secert: data.API_secert };

  await data.action.map(async (A, i) => {
    console.log("action", A);
    let BTKres = {};
    if (A.Action === "BUY") {
      console.log("BUY");
      //prettier-ignore
      BTKres = await BTK.place_bid(client_API, A.Sym, A.lastMoney || A.Amt_money );
    } else if (A.Action === "SELL") {
      console.log("SELL");

      BTKres = await BTK.place_ask_all(client_API, A.Sym);
      // console.log(BTKres);
    }

    if (!BTKres.error == 0) return;

    store_to_history(bot_id, A.Sym, A.Action, BTKres);
  });
  // console.log("data", data);

  // console.log("bot_id", bot_id);
}

async function calc_stg(stg_id) {
  const db = await require("../../services/db_promise");

  const response = await calc_strategy(stg_id);

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

    action: { BNB: "SELL", BTC: "SELL", ADA: "BUY" },
  };

  let sql = `
    SELECT * FROM SelectedAll
    WHERE Strategy_Id= ? AND (Sym = 
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
    // console.log("v", v);
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
    if (v.Type) {
      bot_action[v.Bot_id].action.push({
        Sym: v.Sym,
        Action: symUse.action[v.Sym],
        Amt_money: v.Amt_money,
        lastMoney: v.lastMoney,
      });
    } else {
      bot_action[v.Bot_id].action.push({
        Sym: v.Sym,
        Action: symUse.action[v.Sym],
      });
    }
  });

  // console.log(bot_action);
  // console.log(
  //   Object.fromEntries(
  //     Object.entries(bot_action).map(([k, V]) => {
  //       const newV = Object.fromEntries(
  //         Object.entries(V).filter(([key, v]) => {
  //           return key === "Type" || key === "action";
  //         })
  //       );
  //       console.log(newV);
  //       return [k, newV];
  //     })
  //   )
  // );

  // console.log("bot_action", bot_action);
  const bot_action_filter = Object.fromEntries(
    await Promise.all(
      Object.entries(bot_action).map(async ([k, V]) => {
        `
          
          {
            Type: 1,
            API_key: null,
            API_secert: null,
            action: [ { Sym: 'BTC', Action: 'BUY', Amt_money: 200, lastMoney: 500 } ]
          }
          OR
          {
            Type: 0,
            lineUser_id: 'Ucc2430ec115ca5e9a40a9116819346f9',
            action: [ { Sym: 'ADA', Action: 'SELL', Amt_money: null } ]
          }
        `;
        if (V.Type) {
          // ACTION Trade
          handleActionTrade(V, k);
        } else {
          // ACTION Line1
          handleActionLine(V, stg_id);
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

  return { Action: symUse, bot_action: bot_action_filter };
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

module.exports = router;
