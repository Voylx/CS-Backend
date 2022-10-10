const WebSocket = require("ws");

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

const serverAddress = symstr.substring(0, symstr.length - 1);

console.log(serverAddress);

const ws = new WebSocket(serverAddress);

ws.on("open", () => console.log("Connect"));

ws.on("close", () => console.log("Disconnect"));

ws.on("message", (msg) => {
  try {
    const data = JSON.parse(msg);
    console.log(data?.stream.substring(17), data.rat);
    // console.log(data.sym.slice(4), " : ", data.rat);
  } catch (err) {
    console.log({ error: err.message });
  }
});
