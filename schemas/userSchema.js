/**
 * User Table Schema
 * 
 * This module defines the SQL schema for the `users` table in the MySQL database.
 * It creates the table if it doesn't already exist, ensuring that each user has a unique `userId`, 
 * an `email`, and a `password`. The schema is used to structure and manage user data.
 * 
 * Schema Definition:
 * - `userId`: A unique identifier for each user (VARCHAR).
 * - `email`: The email address of the user (VARCHAR, required).
 * - `password`: The hashed password for user authentication (VARCHAR).
 * 
 * @dependencies None
 * 
 * @project Terminal Consequences
 * @author: sjurbarndon@proton.me
 */

const userSchema = `
  CREATE TABLE IF NOT EXISTS users (
      userId VARCHAR(255) UNIQUE NOT NULL,
      email VARCHAR(255) NOT NULL,
      password VARCHAR(255)
  )
`;

module.exports = userSchema;