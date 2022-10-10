const sma = (length, data) => {
  const result = [];
  if (data.length < length) return data;

  let sum = 0;
  for (let i = 0; i < length; i++) {
    sum += data[i];
  }
  result.push(sum / length);
  let step = data.length - length;
  for (let i = 0; i < step; i++) {
    sum -= data[i];
    sum += data[i + length];
    result.push(sum / length);
  }

  return result;
};

const ema = (length, data) => {
  const ema = [];
  if (data.length < length) return data;
  let sum = 0;
  for (let i = 0; i < length; i++) {
    sum += data[i];
  }
  ema.push(sum / length);
  const multiply = 2 / (length + 1);

  let step = data.length - length;
  for (let i = 0; i < step; i++) {
    let thisema =
      data[i + length] * multiply + ema[ema.length - 1] * (1 - multiply);
    ema.push(thisema);
  }

  return ema;
};

module.exports = { sma, ema };
