const WebSocket = require("ws");

const BTK = require("../src/API/bitkub");

const sym = [
  "ADA",
  "BNB",
  "BTC",
  "DOGE",
  "DOT",
  "ETH",
  "IOST",
  "KUB",
  "LINK",
  "MANA",
  "MATIC",
  "NEAR",
  "SIX",
  "SNT",
  "SNX",
  "SOL",
  "SUSHI",
  "UNI",
  "XLM",
  "XRP",
  "ZRX",
];

const symstr = sym.reduce(
  (pre, cur) => pre + "market.trade.thb_" + cur + ",",
  "wss://api.bitkub.com/websocket-api/"
);
// console.log(symstr.substring(0, symstr.length - 1));

async function store_to_history(
  bot_id,
  sym,
  side,
  bitkub_response,
  balance_before_action,
  balance_after_action
) {
  const db = await require("../src/services/db_promise");

  // console.log("31", bitkub_response.result);
  const { ts, amt, rec } = bitkub_response.result;

  let amt_money, amt_coins;

  if (side === "BUY") {
    amt_money = amt;
    amt_coins = balance_after_action[sym] - balance_before_action[sym];
  }
  if (side == "SELL") {
    amt_money = balance_after_action["THB"] - balance_before_action["THB"];
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

async function main() {
  const db = await require("../src/services/db_promise");
  const serverAddress = symstr.substring(0, symstr.length - 1);

  console.log(serverAddress);

  const sql = `
    SELECT SLTP.user_id, Sym, TP, SL, API_key, API_secert, Bot_id
      FROM SLTP
      JOIN bitkub ON SLTP.user_id = bitkub.User_id
      JOIN bot ON bot.User_id = SLTP.user_id AND bot.Type = 1
      WHERE Sym = ? AND (TP <= ? OR SL >= ?)
  `;

  const ws = new WebSocket(serverAddress);

  ws.on("open", () => console.log("Connect"));

  ws.on("close", () => console.log("Disconnect"));

  ws.on("message", async (msg) => {
    try {
      const data = JSON.parse(msg);
      const sym = data?.stream.substring(17);
      const price = data.rat;

      // console.log(sym, price);
      const [Actions] = await db.query(sql, [sym, price, price]);
      if (Actions.length === 0) return;
      Actions.map(async (action) => {
        const client_API = { key: action.API_key, secert: action.API_secert };

        //เก็บ balances ก่อนจะขาย
        const balance_before_action = await BTK.wallet(
          action.API_key,
          action.API_secert
        ).then((res) => res.result);

        //ขาย
        BTKres = await BTK.place_ask_all(client_API, action.Sym);

        //เก็บ balances หลังขาย
        const balance_after_action = await BTK.wallet(
          action.API_key,
          action.API_secert
        ).then((res) => res.result);

        if (!BTKres.error == 0) return;

        // เก็บ ประวัติ
        store_to_history(
          action.Bot_id,
          action.Sym,
          "SELL",
          BTKres,
          balance_before_action,
          balance_after_action
        );

        //ลบการเลือก tp/sl
        const [result] = await db.query(
          "DELETE FROM SLTP WHERE user_id = ? AND Sym = ?",
          [action.user_id, action.Sym]
        );
      });
      // console.log(users);
    } catch (err) {
      console.log({ error: err.message || err.sqlMessage || err });
    }
  });
}
main();
