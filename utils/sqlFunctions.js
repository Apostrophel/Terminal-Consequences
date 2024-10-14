/**
 * SQL Utility Functions
 * 
 * This module provides utility functions for interacting with the MySQL database.
 * It includes methods to create tables, check for existing records, and insert new records.
 * All functions return Promises for asynchronous handling.
 * 
 * Key Functions:
 * - `createTable`: Executes a query to create a new table based on a provided schema.
 * - `checkRecordExists`: Checks if a record exists in a specific table by querying a column for a matching value.
 * - `insertRecord`: Inserts a new record into a specified table using an object format.
 * 
 * @dependencies
 * - `mysql2`: Library used to execute SQL queries.
 * - `config`: Database configuration settings imported from the `db/config` module.
 * 
 * @project Terminal Consequences
 * @author: sjurbarndon@proton.me
 */

const mysql = require("mysql2");
const config = require("../db/config");

const pool = mysql.createPool(config);

const createTable = (schema) => {
  return new Promise((resolve, reject) => {
    pool.query(schema, (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

const checkRecordExists = (tableName, column, value) => {
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM ${tableName} WHERE ${column} = ?`;

    pool.query(query, [value], (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results.length ? results[0] : null);
      }
    });
  });
};

const insertRecord = (tableName, record) => {
  return new Promise((resolve, reject) => {
    const query = `INSERT INTO ${tableName} SET ?`;

    pool.query(query, [record], (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

const getChatLogs = (roomId) => {
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM chat_logs WHERE roomId = ? ORDER BY timestamp DESC LIMIT 50`; // Retrieves the latest 50 messages

    pool.query(query, [roomId], (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

module.exports = {
   createTable,
   checkRecordExists,
   insertRecord,
   getChatLogs,
};
