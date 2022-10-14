const strategies = require("./emacross");
const Axios = require("../services/Axios");
const BTK = require("../API/bitkub");

const strategy_name = {
  1: "cdc",
  2: "cdc",
  3: "ema_10_21",
  4: "ema_10_21",
  5: "ema_10_21",
};

const calc_strategy = async (stg_id) => {
  const stg = strategy_name[stg_id];

  if (stg !== "cdc" && stg !== "ema_10_21") {
    return "strategies not supported";
  }
  try {
    const ress = await Axios.get("/symbols");
    const symbols = ress.data.symbols;
    const promises = [];
    symbols.map((sym) => {
      const data = BTK.getclosechart(sym, "1D", 200);
      promises.push(data);
    });
    const datas = await Promise.all(promises);
    const result = {};
    symbols.map((sym, i) => {
      //   result.push({ [sym]: strategies[stg](datas[i]) });
      result[sym] = strategies[stg](datas[i]);
    });
    return { strategy: stg, result };
  } catch (err) {
    console.log(err);
  }
};
module.exports = calc_strategy;
