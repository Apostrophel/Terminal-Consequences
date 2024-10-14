/**
 * Authentication Routes
 * 
 * This module defines the routes related to user authentication, including
 * endpoints for user registration and login. The routes forward requests to the 
 * corresponding controller functions in `authControllers`.
 * 
 * Key Functions:
 * - `POST /register`: Calls the `register` function to create a new user.
 * - `POST /login`: Calls the `login` function to authenticate a user.
 * 
 * @dependencies
 * - `authControllers`: The module containing the registration and login logic.
 * 
 * @project Terminal Consequences
 * @author: sjurbarndon@proton.me
 */

const express = require("express");
const { register, login } = require("../controllers/authControllers");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

module.exports = router;