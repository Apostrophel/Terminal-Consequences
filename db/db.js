
const mysql = require("mysql2");
const config = require("./config");

//import mysql from 'mysql2';
//import config from './config.js'

const connectDB = async () => {
  const pool = mysql.createPool(config);

  pool.getConnection((err, connection) => {
    if (err) {
      console.log({ error: err.message });
    }

    console.log("Connected to MySQL database");
    if (connection) {
      connection.release();
    }
  });
};

module.exports = connectDB;

//export default connectDB;
