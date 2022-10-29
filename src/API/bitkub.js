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

const wallet = async (key, secert) => {
  const ts = await getSevertime();

  const data = { ts: ts };
  data.sig = hash(data, secert);

  try {
    const result = await axios.post("/api/market/wallet", data, {
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

  const wallet_data = await wallet(key, secert);
  const wallet_sym_data = wallet_data.result[sym];
  if (wallet_sym_data)
    return {
      error: 99,
      message: `Can't Buy ${sym}, ${sym} is already your wallet`,
    };

  const ts = await getSevertime();
  // console.log("key", key);
  // console.log("secert", secert);

  const data = {
    ts: ts,
    sym: `THB_${sym}`,
    amt: amt,
    typ: "market",
    rat: 0,
  };
  data.sig = hash(data, secert);

  try {
    const result = await axios.post("/api/market/place-bid", data, {
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
    sym: `THB_${sym}`,
    amt: amt,
    typ: "market",
    rat: 0,
  };
  data.sig = hash(data, secert);

  try {
    const result = await axios.post("/api/market/place-ask", data, {
      headers: header(key),
    });
    return result.data;
  } catch (err) {
    return err;
  }
};

const place_ask_all = async ({ key, secert }, sym) => {
  const wallet_data = await wallet(key, secert);
  const sell_amt = wallet_data.result[sym];
  if (!sell_amt)
    return {
      error: 99,
      message: `Can't Sell ${sym}, Don't have ${sym} in your wallet`,
    };
  return await place_ask({ key, secert }, sym, sell_amt);
};

const order_info = async ({ key, secert }, order_hash) => {
  if (!order_hash) return;
  const ts = await getSevertime();

  const data = {
    ts: ts,
    hash: order_hash,
  };
  data.sig = hash(data, secert);

  try {
    const result = await axios.post("/api/market/order-info", data, {
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
  const close_data = result.c;
  if (tf == "60" || tf == "240") close_data.pop();

  return close_data;
};

const get_close_timechart = async (symbol, tf, day) => {
  const result = await getchart(symbol, tf, day);
  const close_data = result.c;
  const close_time = result.t;
  if (tf == "60" || tf == "240") {
    close_data.pop();
    close_time.pop();
  }

  return { data: close_data, time: close_time };
};

const getticker = async () => {
  const result = await axios.get("/api/market/ticker");
  return result.data;
};
module.exports = {
  getSevertime,
  balances,
  wallet,
  place_bid,
  place_ask,
  place_ask_all,
  getchart,
  getclosechart,
  get_close_timechart,
  getticker,
  order_info,
};
