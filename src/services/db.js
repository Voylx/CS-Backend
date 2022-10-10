const mysql = require("mysql2");

// create the connection to database
const db = mysql.createConnection({
  host: "pro.freedb.tech",
  user: "Channatt_ku_root",
  password: "%y8dJ@vV*syVQ3Y",
  database: "Channatt_ku",
  // multipleStatements: true,
});

module.exports = db;
