const mysql = require("mysql2/promise");

const { dbconnect } = require("./db");

// create the connection to database
// const db = mysql.createConnection(dbconnect);

// module.exports = { db, dbconnect };

module.exports = (async function () {
  // create the connection to database
  const db = await mysql.createConnection(dbconnect);

  return db;
})();
