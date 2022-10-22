const mysql = require("mysql2/promise");

const dbconnect = {
  host: "pro.freedb.tech",
  user: "Channatt_ku_root",
  password: "%y8dJ@vV*syVQ3Y",
  database: "Channatt_ku",

  // multipleStatements: true,
};

// create the connection to database
// const db = mysql.createConnection(dbconnect);

// module.exports = { db, dbconnect };

module.exports = (async function () {
  // get the client
  const mysql = require("mysql2");
  // create the pool
  const pool = mysql.createPool(dbconnect);
  // now get a Promise wrapped instance of that pool
  const db = pool.promise();

  // // create the connection to database
  // const db = await mysql.createConnection(dbconnect);

  return db;
})();
