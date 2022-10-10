"use strict";
const line = require("@line/bot-sdk");

const Line = {
  client: new line.Client({
    channelAccessToken:
      "thycWu8MBIKPETvBc3K77vJmvNVNJzIzRkq54WiezgKG7b4XFnANktSxSeSXUpsB4ZACjXZCJENtmlmKcAMqhoEzc04PiiqLTBk4rcr19cZa/SLzVh436CNYigDoEg5sp14MEIoP8IxkHmX1an6KwgdB04t89/1O/w1cDnyilFU=",
  }),
  message: {
    type: "text",
    text: "Hello, world!",
  },
  reply: async function (replyToken, text) {
    this.message.text = text;
    try {
      await this.client.replyMessage(replyToken, this.message);
      return { status: "ok", message: "reply success" };
    } catch (err) {
      // error handling
      console.log(err);
      throw err;
    }
  },
  async push(lineuserid, text) {
    let ret;
    this.message.text = text;
    try {
      await this.client.pushMessage(lineuserid, this.message);
      return { status: "ok", message: "push success" };
    } catch (err) {
      // error handling
      console.log(err);
      throw err;
    }
  },
};

module.exports = Line;
