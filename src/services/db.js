const mysql = require("mysql2");

const dbconnect = {
  host: "pro.freedb.tech",
  user: "Channatt_ku_root",
  password: "%y8dJ@vV*syVQ3Y",
  database: "Channatt_ku",
  // multipleStatements: true,
};

// create the connection to database
const db = mysql.createConnection(dbconnect);

module.exports = { db, dbconnect };
