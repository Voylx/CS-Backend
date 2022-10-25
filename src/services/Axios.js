const axios = require("axios");

const instance = axios.create({
  // baseURL: "http://localhost:3333",
  baseURL: "https://cs-project-b.herokuapp.com",
  // baseURL: "http://192.168.137.1:3333",
});

module.exports = instance;
