const mysql = require("mysql2");

// create the connection to database
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  database: "database-csproject",
  multipleStatements: true,
});

module.exports = db;
