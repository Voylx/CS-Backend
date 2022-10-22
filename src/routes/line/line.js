const express = require("express");

const authgetuser = require("../../middleware/authen_and_getuserid");

const router = express.Router();

const line = require("../../services/line");

router.post("/linewebhook", async (req, res) => {
  const db = await require("../../services/db_promise");
  const { events } = req.body;
  const lineuserid = events[0]?.source?.userId;
  const replyToken = events[0]?.replyToken;
  const text = events[0]?.message?.text;
  // prettier-ignore
  if (!text||!lineuserid||!text) {  res.send("ok"); return; }

  //todooooo
  //เอาlineuseridไปเชคในตาราง line
  // prettier-ignore
  try {
    const [lineUsers] = await db.execute("SELECT * FROM line WHERE LineUser_id = ?",[lineuserid]);
    if (lineUsers.length > 0) { res.send("ok"); return; }
    // ถ้าไม่มี ค่อยทำ
    // check text and rand_num
    const [data] = await db.query( "SELECT * FROM prelinkline WHERE rand_num = ?", [text] );
    if (data.length === 0) { res.send("ok"); return; }

    // store line_users_id in line table
    await db.query("INSERT INTO line (User_id, LineUser_id) VALUES (?,?);", [data[0].User_id, lineuserid]);
    
    // delete in prelinkline
    await db.query("DELETE FROM prelinkline WHERE User_id = ?", [data[0].User_id]);
    
    line
      .reply(replyToken, "Connect Success")
      .then((e) => res.send(e));

  } catch (error) {
    console.error(error);
    res.status(500).send({ status: "error", message: error });
  }
});

router.post("/pushtextmessage", async (req, res) => {
  const { text, lineuserid } = req.body;
  if (!text || !lineuserid) {
    res.status(400).send({
      status: "error",
      message: "Incomplete request",
    });
    return;
  }

  const resp = await line.push(lineuserid, text);
  console.log(resp);
  res.send(resp);
});

router.post("/prelinkline", authgetuser, async (req, res) => {
  const db = await require("../../services/db_promise");
  const { User_id } = req.body;
  const rand_num = 100000 + Math.floor(Math.random() * 800000);
  console.log(rand_num);

  try {
    const [results] = await db.execute(
      "INSERT IGNORE INTO prelinkline (User_id, rand_num ) VALUES (?,?)",
      [User_id, rand_num]
    );
    if (results.affectedRows === 0) {
      res.status(200).send({
        status: "error",
        message: "Already insert in prelinkline table",
      });
      return;
    }
    res.send({
      status: "ok",
      message: "success",
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send({ status: "error", message: error.sqlMessage || error });
  }
});

router.post("/get_prelinkline", authgetuser, async (req, res) => {
  const db = await require("../../services/db_promise");
  const { User_id } = req.body;
  try {
    const [results] = await db.execute(
      "SELECT * FROM prelinkline Where  user_id =? ",
      [User_id]
    );
    if (results.length === 0) {
      res.status(200).send({
        status: "ok",
        data: null,
      });
    } else {
      res.send({
        status: "ok",
        data: results[0],
      });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send({ status: "error", message: error.sqlMessage || error });
  }
});

module.exports = router;

//LineId:@336coaib
