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

// Function to delete records from a specific table
const deleteRecords = (tableName, conditions) => {
  return new Promise((resolve, reject) => {
    const conditionKeys = Object.keys(conditions);
    const conditionString = conditionKeys.map(key => `${key} = ?`).join(' AND ');
    const values = Object.values(conditions);

    const query = `DELETE FROM ${tableName} WHERE ${conditionString}`;

    // Use the promise version of the query
    pool.promise().query(query, values)
      .then(([results]) => {
        resolve(results); // Resolve the results
      })
      .catch(error => {
        console.error(`Error deleting records from ${tableName}:`, error);
        reject(error); // Reject with the error
      });
  });
};

const getChatLogs = (roomId) => {
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM chat_logs WHERE roomId = ? ORDER BY timestamp DESC LIMIT 25`; // Retrieves the latest 50 messages

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
   deleteRecords,
   getChatLogs,
};
