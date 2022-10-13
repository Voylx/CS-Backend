const express = require("express");

const { db } = require("../../services/db");

const authgetuser = require("../../middleware/authen_and_getuserid");

const router = express.Router();

const line = require("../../services/line");

router.post("/linewebhook", (req, res) => {
  const { events } = req.body;
  const lineuserid = events[0].source.userId;
  const replyToken = events[0].replyToken;
  const text = events[0]?.message?.text;
  // prettier-ignore
  if (!text) {  res.send("ok"); return; }

  //todooooo
  //เอาlineuseridไปเชคในตาราง line
  db.query(
    "SELECT * FROM line WHERE LineUser_id = ?",
    [lineuserid],
    (err, lineUsers) => {
      // prettier-ignore
      if (err) {res.status(500).send({ status: "error", message: err }); return; }
      // prettier-ignore
      if (lineUsers.length > 0) { res.send("ok"); return; }
      // ถ้าไม่มี ค่อยทำ
      console.log(text);
      // check text and rand_num
      db.query(
        "SELECT * FROM prelinkline WHERE rand_num = ?",
        [text],
        (err, data) => {
          // prettier-ignore
          if (err) {res.status(500).send({ status: "error", message: err }); return; }
          // prettier-ignore
          if (data.length === 0) { res.send("ok"); return; }

          // store line_users_id in line table
          db.execute(
            "INSERT INTO line (User_id, LineUser_id) VALUES (?,?); ",
            [data[0].User_id, lineuserid],
            (err, results) => {
              if (err) {
                console.log(err);
                res.status(500).send({ status: "error", message: err });
                return;
              }
              db.execute(
                "DELETE FROM prelinkline WHERE User_id = ?",
                [data[0].User_id],
                (err, results) => {
                  if (err) {
                    console.log(err);
                    res.status(500).send({ status: "error", message: err });
                    return;
                  }

                  line
                    .reply(replyToken, "Connect Success")
                    .then((e) => res.send(e));
                }
              );
            }
          );
        }
      );
    }
  );
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

router.post("/prelinkline", authgetuser, (req, res) => {
  const { User_id } = req.body;
  const rand_num = 100000 + Math.floor(Math.random() * 800000);
  console.log(rand_num);
  db.execute(
    "INSERT IGNORE INTO prelinkline (User_id, rand_num ) VALUES (?,?)",
    [User_id, rand_num],
    (err, results) => {
      if (err) {
        console.error(err);
        res.status(500).send({ status: "error", message: err.sqlMessage });
        return;
      }
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
    }
  );
});

router.post("/get_prelinkline", authgetuser, (req, res) => {
  const { User_id } = req.body;
  db.execute(
    "SELECT * FROM prelinkline Where  user_id =? ",
    [User_id],
    function (err, results) {
      //Check SQL Error
      if (err) {
        console.error(err);
        res.status(500).send({ status: "error", message: err.sqlMessage });
      } else if (results.length === 0) {
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
    }
  );
});

module.exports = router;

//LineId:@336coaib
