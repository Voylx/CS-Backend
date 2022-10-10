const mysql = require("mysql2");

// create the connection to database
const db = mysql.createConnection({
  host: "qvti2nukhfiig51b.cbetxkdyhwsb.us-east-1.rds.amazonaws.com",
  user: "jnxbez02f9mr80mo",
  password: "ezxuyhsrstmjd21j",
  database: "bp31kt8v8vsp23nn",
  // multipleStatements: true,
});

module.exports = db;
