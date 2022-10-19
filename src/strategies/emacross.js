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
const cdc_test = (data) => {
  const fast = 12;
  const slow = 26;
  return emacross_test(data, { fast, slow });
};

const ema_10_21_test = (data) => {
  const fast = 10;
  const slow = 21;
  return emacross_test(data, { fast, slow });
};

// END TEST

const emacross = (data, { fast, slow }) => {
  try {
    // check is data null or undefined
    if (typeof data === "undefined" || data === null) return "No Data";

    const slow_ema = ema(slow, data);
    const fast_ema = ema(fast, data);

    if (
      fast_ema[fast_ema.length - 1] > slow_ema[slow_ema.length - 1] &&
      fast_ema[fast_ema.length - 2] < slow_ema[slow_ema.length - 2]
    )
      return "BUY";
    else if (
      fast_ema[fast_ema.length - 1] < slow_ema[slow_ema.length - 1] &&
      fast_ema[fast_ema.length - 2] > slow_ema[slow_ema.length - 2]
    )
      return "SELL";
    else return "No Action";
  } catch (error) {
    console.log(error);
  }
};

//TEST
const emacross_test = (data, { fast, slow }) => {
  try {
    // check is data null or undefined
    if (typeof data === "undefined" || data === null) return "No Data";

    const slow_ema = ema(slow, data);
    const fast_ema = ema(fast, data);

    return { slow: slow_ema, fast: fast_ema };
  } catch (error) {
    console.log(error);
  }
};

//END TEST

module.exports = { cdc, ema_10_21, cdc_test, ema_10_21_test };
