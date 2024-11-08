/**
 * Chat Database Controllers
 * 
 * This module provides the controllers responsible for handling chat database operations,
 * including creating tables, inserting messages, and retrieving chat logs.
 * 
 * Key Functions:
 * 
 * @dependencies
 * - `sqlFunctions`: Custom utility functions to interact with the database (createTable, checkRecordExists, insertRecord).
 * - `chatlogSchema`: Defines the schema for the users table in the database.
 * 
 * @project Terminal Consequences
 * @author: sjurbarndon@proton.me
 */

const { v4: uuidv4 } = require("uuid");
const chatlogSchema = require("../schemas/chatlogSchema");
const {
   createTable,
   insertRecord,
   manageMessageLimit,
   deleteRecords,
   getChatLogs,
   getUserSettings,
  } = require("../utils/sqlFunctions");

// Function to initialize the chat logs table
const initializeChatLogs = async () => {
  try {
    await createTable(chatlogSchema);
    console.log("Chat logs table created or already exists.");
  } catch (error) {
    console.error("Error creating chat logs table:", error);
    throw error; // Rethrow the error to be handled at a higher level if necessary
  }
};

// Function to insert a new chat message into the chat logs
const insertChatLog = async (messageId, roomId, userId, message) => {
  const chatLog = {
    messageId,
    roomId,
    userId,
    message,
  };

  try {
    await insertRecord("chat_logs", chatLog);
    console.log("Chat message inserted successfully:", chatLog);

    if (roomId === 'mainLobby'){
      await manageMessageLimit(roomId);
    }
  } catch (error) {
    console.error("Error inserting chat message:", error);
    throw error; // Rethrow the error to be handled at a higher level if necessary
  }
};

const retreiveUserSettings = async (user_name) => {
  try {
    const logs = await getUserSettings(user_name);
    return logs;
  } catch (error) {
    console.error("Error retrieving chat logs:", error);
    throw error; // Rethrow the error to be handled at a higher level if necessary
  }
};

// Function to retrieve chat logs for a specific room
const retrieveChatLogs = async (roomId) => {
  try {
    const logs = await getChatLogs(roomId);
    return logs;
  } catch (error) {
    console.error("Error retrieving chat logs:", error);
    throw error; // Rethrow the error to be handled at a higher level if necessary
  }
};

// Function to delete all chat logs for a specific room
const deleteChatLogsByRoom = async (roomId) => {
  try {
    await deleteRecords('chat_logs', { roomId });
    console.log(`Chat logs for room ${roomId} deleted successfully.`);
  } catch (error) {
    console.error(`Error deleting chat logs for room ${roomId}:`, error);
    throw error; // Rethrow the error to be handled at a higher level if necessary
  }
};

module.exports = {
  initializeChatLogs,
  insertChatLog,
  retreiveUserSettings,
  retrieveChatLogs,
  deleteChatLogsByRoom,
};