const express = require("express");
const { register, login } = require("../controllers/authControllers");
//import express from 'express';
//import {register, login} from'../controllers/authControllers.js'

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

module.exports = router;

//export default router;