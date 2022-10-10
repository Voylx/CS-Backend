const mysql = require("mysql2");

// create the connection to database
const db = mysql.createConnection({
  host: "sql.freedb.tech",
  user: "freedb_anas_title",
  password: "3a5RU2!hnfAKd5M",
  database: "freedb_cs-project",
  multipleStatements: true,
});

module.exports = db;
