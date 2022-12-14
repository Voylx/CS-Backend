const express = require("express");
const cors = require("cors");
// const { db } = require("./src/services/db");
const { v4: uuidv4 } = require("uuid");

const bcrypt = require("bcrypt");
const saltRounds = 13;

const { authen, createToken } = require("./src/services/authen");

const apibot = require("./src/routes/apibot");
const apibot_get = require("./src/routes/apibot_get");
const line = require("./src/routes/line/line");

const app = express();

const port = process.env.PORT || 3333;

app.use(cors());
app.use(express.json());

app.use("/api", apibot_get);
app.use("/api", apibot);

app.use("/", line);

app.get("/", (req, res) => {
  res.send(
    `<h1 style="color:blue;text-align:center; justify-content:center">Crypto Bot API</h1>`
  );
});

app.post("/register", async function (req, res) {
  const db = await require("./src/services/db_promise");
  const { email, username, password } = req.body;
  const user_id = uuidv4();
  if (!(email && username && password)) {
    res.status(400).send({
      status: "error",
      message: "Incomplete information!!!",
    });
  } else {
    //hash password
    bcrypt.hash(password, saltRounds, async function (err, hash) {
      // Store hash in your password DB.
      try {
        const [result] = await db.execute(
          "INSERT IGNORE INTO users (user_id, username, email, password) VALUES (?,?,?,?)",
          [user_id, username, email, hash]
        );
        if (result.affectedRows === 0) {
          res.status(400).send({
            status: "error",
            message: "This Email is already registered",
          });
        } else
          res.send({
            status: "ok",
            message: { affectedRows: result.affectedRows },
          });
      } catch (error) {
        console.log(error);
        res.status(500).send({ status: "error", message: error.sqlMessage });
      }
    });
  }
});

app.post("/login", async function (req, res) {
  const db = await require("./src/services/db_promise");
  const { email, password } = req.body;
  // console.log(email, password);

  if (!(email && password)) {
    {
      res.status(400).send({
        status: "error",
        message: "Incomplete information!!!",
      });
      return;
    }
  }
  try {
    const [users] = await db.execute("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    // console.log(password, users[0].password);
    if (users.length === 0) {
      res.status(404).send({ status: "error", message: "User not found" });
    } else {
      bcrypt.compare(password, users[0].password, function (err, result) {
        if (result) {
          // const token = jwt.sign({ user_id: users[0].user_id }, secert, {
          //   expiresIn: "1h",
          // });
          const token = createToken(users[0].user_id);
          res.send({ status: "ok", message: "login success", token: token });
        } else {
          res.status(400).send({
            status: "error",
            message: "The password that you've entered is incorrect.",
          });
        }
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({ status: "error", message: error.sqlMessage });
  }
});

app.post("/authen", function (req, res) {
  // console.log(req.headers.authorization);
  try {
    const token = req.headers.authorization.split(" ")[1];
    const response = authen(token);
    res.send(response);
    // if (response.status === "ok") res.send(response);
    // else res.status(400).send(response);
  } catch (error) {
    console.log(error);
    res.status(401).send({ status: "error", message: "Token invalid" });
  }
});

app.get("/symbols", async function (req, res) {
  const db = await require("./src/services/db_promise");
  try {
    const [data] = await db.execute("SELECT * FROM symbols");
    const symbols = data.map((V, I) => V.Sym);
    res.send({ status: "ok", symbols: symbols });
  } catch (err) {
    console.log(err);
    res.status(500).send({ status: "error", message: err.sqlMessage || err });
  }
});

app.get("/strategies", async (req, res) => {
  const db = await require("./src/services/db_promise");
  try {
    const [data] = await db.execute("SELECT * FROM strategies");
    const response = {};
    data.map(({ Strategy_id, Strategy_name }) => {
      response[Strategy_id] = Strategy_name;
    });
    res.send({ status: "ok", strategies: response });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .send({ status: "error", message: error.sqlMessage || error });
  }
});

app.get("/test", async (req, res) => {
  const db = await require("./src/services/db_promise");
  try {
    const [data] = await db.execute("SELECT * FROM `bitkub`");
    console.log(data);
    res.send({ message: "test", data });
  } catch (err) {
    console.log(err);
    res.send({ message: "test error" });
  }
});

app.listen(port, function () {
  console.log("CORS-enabled web server listening on port " + port);
});
