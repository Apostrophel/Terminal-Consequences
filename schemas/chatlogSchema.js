/**
 * Chatlog Table Schema
 * 
 * This module defines the SQL schema for the `chat_logs` table in the MySQL database.
 * It creates the table if it doesn't already exist, ensuring that each chat message 
 * is uniquely identified and associated with a user and optionally with a room.
 * The schema also records the timestamp for each message.
 * 
 * Schema Definition:
 * - `messageId`: A unique identifier for each chat message (VARCHAR).
 * - `userId`: The identifier of the user who sent the message (VARCHAR).
 * - `message`: The content of the chat message (TEXT, required).
 * - `timestamp`: The time when the message was sent (TIMESTAMP, defaults to the current time).
 * - `roomId`: The ID of the room where the message was sent (VARCHAR, optional).
 * 
 * @dependencies: None
 * 
 * @project Terminal Consequences
 * @author: sjurbarndon@proton.me
 */

const chatlogSchema = `
  CREATE TABLE IF NOT EXISTS chat_logs (
      messageId VARCHAR(255) UNIQUE NOT NULL,
      userId VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      roomId VARCHAR(255) DEFAULT NULL
  )
`;

module.exports = chatlogSchema;