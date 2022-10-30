const { ema } = require("./indicator/ma");

const cdc = (data) => {
  const fast = 12;
  const slow = 26;
  return emacross(data, { fast, slow });
};

const ema_10_21 = (data) => {
  const fast = 10;
  const slow = 21;
  return emacross(data, { fast, slow });
};

// Test
const cdc_getema = (data) => {
  const fast = 12;
  const slow = 26;
  return getemacross(data, { fast, slow });
};

const ema_10_21__getema = (data) => {
  const fast = 10;
  const slow = 21;
  return getemacross(data, { fast, slow });
};

const getEMA = {
  cdc: (data) => cdc_getema(data),
  ema_10_21: (data) => ema_10_21__getema(data),
};

// END TEST

const emacross = (data, { fast, slow }) => {
  try {
    // check is data null or undefined
    if (typeof data === "undefined" || data === null) return "No Data";

    const slow_ema = [...Array(slow - 1).fill(null), ...ema(slow, data)];
    const fast_ema = [...Array(fast - 1).fill(null), ...ema(fast, data)];

    if (
      fast_ema[fast_ema.length - 1] > slow_ema[slow_ema.length - 1] &&
      fast_ema[fast_ema.length - 2] <= slow_ema[slow_ema.length - 2]
    )
      return "BUY";
    else if (
      fast_ema[fast_ema.length - 1] < slow_ema[slow_ema.length - 1] &&
      fast_ema[fast_ema.length - 2] >= slow_ema[slow_ema.length - 2]
    )
      return "SELL";
    else return "No Action";
  } catch (error) {
    console.log(error);
  }
};

//TEST
const getemacross = (data, { fast, slow }) => {
  try {
    // check is data null or undefined
    if (typeof data === "undefined" || data === null) return "No Data";

    const slow_ema = [...Array(slow - 1).fill(null), ...ema(slow, data)];
    const fast_ema = [...Array(fast - 1).fill(null), ...ema(fast, data)];

    return { slow: slow_ema, fast: fast_ema };
  } catch (error) {
    console.log(error);
  }
};

//END TEST

module.exports = { cdc, ema_10_21, getEMA };
