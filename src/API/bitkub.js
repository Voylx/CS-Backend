const axios = require("axios");
const crypto = require("crypto");

// const API = require("./secret.json");

axios.defaults.baseURL = "https://api.bitkub.com";

const header = (key) => {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-BTK-APIKEY": key,
  };
};

function hash(data, secert) {
  const j = JSON.stringify(data);
  return crypto.createHmac("sha256", secert).update(j).digest("hex");
}

const getSevertime = async () => {
  const result = await axios.get("/api/servertime");
  return result.data;
};

const getsymbols = async () => {
  const result = await axios.get("/api/market/symbols");
  return result.data.result;
};

const balances = async (key, secert) => {
  const ts = await getSevertime();

  const data = { ts: ts };
  data.sig = hash(data, secert);

  try {
    const result = await axios.post("/api/market/balances", data, {
      headers: header(key),
    });
    return result.data;
  } catch (err) {
    // console.error(err);
    return { error: err };
  }
};

const place_bid = async ({ key, secert }, sym, amt) => {
  // EX.symbol "THB_BTC"
  const ts = await getSevertime();

  const data = {
    ts: ts,
    sym: sym,
    amt: amt,
    typ: "market",
    rat: 0,
  };
  data.sig = hash(data, secert);

  try {
    const result = await axios.post("/api/market/place-bid/test", data, {
      headers: header(key),
    });
    return result.data;
  } catch (err) {
    return err;
  }
};

const place_ask = async ({ key, secert }, sym, amt) => {
  const ts = await getSevertime();

  const data = {
    ts: ts,
    sym: sym,
    amt: amt,
    typ: "market",
    rat: 0,
  };
  data.sig = hash(data, secert);

  try {
    const result = await axios.post("/api/market/place-ask/test", data, {
      headers: header(key),
    });
    return result.data;
  } catch (err) {
    return err;
  }
};

const getchart = async (symbol, tf = "1D" || "240" || "60", day = 5) => {
  // const resolution = "1D";
  const now = Math.floor(Date.now() / 1000);
  // const daysec = 86400;
  const sectime = {
    "1D": 86400,
    240: 14400,
    60: 3600,
  };
  // const day = 5;
  // if (day == null) day = 5;
  // console.log(sectime[tf]);
  const from = now - sectime[tf] * day;

  const to = now;

  const result = await axios.get(
    `/tradingview/history?symbol=${symbol}_THB&resolution=${tf}&from=${from}&to=${to}`
  );
  ``;

  return result.data;
};
const getclosechart = async (symbol, tf, day) => {
  const result = await getchart(symbol, tf, day);
  return result.c;
};

const getticker = async () => {
  const result = await axios.get("/api/market/ticker");
  return result.data;
};
module.exports = {
  getSevertime,
  balances,
  place_bid,
  place_ask,
  getchart,
  getclosechart,
  getticker,
};
