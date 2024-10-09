const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");
const userSchema = require("../schemas/userSchema");
const bcrypt = require("bcryptjs");
const {
   createTable,
   checkRecordExists,
   insertRecord,
  } = require("../utils/sqlFunctions");


// import { v4 as uuidv4 } from 'uuid';
// import jwt from 'jsonwebtoken';
// import userSchema from '../schemas/userSchema.js'
// import bcrypt from 'bcryptjs/dist/bcrypt.js';
// import {createTable, checkRecordExists, insertRecord} from '../utils/sqlFunctions.js'

const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

const register = async (req, res) => {
  const { username, password } = req.body;
  
  // Check for empty fields
  if (!username || !password) {
    console.error("Registration attempt with missing fields:", { username, password });
    return res.status(400).json({ error: "Username or Password fields cannot be empty!" });
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  const user = {
    userId: uuidv4(),
    username,
    password: hashedPassword,
  };

  try {
    await createTable(userSchema);
    
    // Check if the username already exists
    const userAlreadyExists = await checkRecordExists("users", "username", username);
    if (userAlreadyExists) {
      console.error("Registration failed: Username already exists", { username });
      return res.status(409).json({ error: "Username already exists" });
    } else {
      await insertRecord("users", user);
      console.log("User created successfully:", { username });
      return res.status(201).json({ message: "User created successfully!" });
    }

  } catch (error) {
    console.error("Error during registration:", error); // Log the exact error
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
};




const login = async (req, res) => {
  const { username, password } = req.body;

  // Check if username and password are provided
  if (!username || !password) {
    console.log('Login attempt with missing fields:', { username, password });
    return res.status(400).json({ error: "Username or Password fields cannot be empty!" });
  }

  try {
    // Check if the user exists
    const existingUser = await checkRecordExists("users", "username", username);
    console.log('User lookup result:', existingUser);

    if (existingUser) {
      // Ensure the password field exists
      if (!existingUser.password) {
        console.log('User found but password is missing for username:', username);
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Compare the passwords
      const passwordMatch = await bcrypt.compare(password, existingUser.password);
      console.log('Password comparison result:', passwordMatch);

      if (passwordMatch) {
        // Successful login
        console.log('Login successful for user:', existingUser.userId);
        return res.status(200).json({
          userId: existingUser.userId,
          username: existingUser.username,
          token: generateAccessToken(existingUser.userId),
        });
      } else {
        // Password did not match
        console.log('Password did not match for username:', username);
        return res.status(401).json({ error: "Invalid credentials" });
      }
    } else {
      // User not found
      console.log('No user found with username:', username);
      return res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (error) {
    // Log the error and send a response
    console.error('Error during login process:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
};



module.exports = {
  register,
  login,
};


//export {register, login};