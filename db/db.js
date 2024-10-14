/**
 * Database Connection
 * 
 * This module establishes a connection to the MySQL database using the `mysql2` library.
 * It uses a connection pool to manage multiple connections efficiently and logs
 * successful connections or errors.
 * 
 * Key Function:
 * - `connectDB`: Connects to the MySQL database and releases the connection back to the pool.
 * 
 * @dependencies
 * - `config`: Contains the configuration settings for the MySQL connection.
 * - `mysql2`: Library used to create a connection pool and interact with MySQL.
 * 
 * @project Terminal Consequences
 * @author: sjurbarndon@proton.me
 */


const mysql = require("mysql2");
const config = require("./config");

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