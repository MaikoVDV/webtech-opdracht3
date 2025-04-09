import { initDB, SqliteStore } from "./connect-database.js";
import { loginRouteHandler, registerRouteHandler, getLoggedInUser, checkLoggedIn, checkIsLoggedInUser, checkShareCourses, checkAreFriends } from "./api/account-management.js";
import { getUser, getProfilePhoto, getFriends, getCourses, getCourseParticipants } from "./api/users.js";
import { updateFriendshipHandler, getFriendReqsHandler, respondFriendReqHandler } from "./api/friends.js";
import { getChatHandler, sendMessageHandler } from "./api/chat.js";
import { updateUserInfo } from "./api/profile-management.js";

import fs from "fs";
import express from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import session from "express-session";
import bcrypt from "bcrypt";
import path from "path";
import { fileURLToPath } from "url";
import bodyParser from "body-parser"; // For easier parsing of request bodies, like form data.
import { body, check, param, validationResult } from "express-validator"; // Validating user data and preventing XSS

export const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 8010;
const basepath = process.env.BASE_PATH || "";

/*
The main JavaScript file, which configures all our packages and express routes.
Routes are all specified individually here with their appropriate middlewares (mostly for input validation).
*/

// Make sure asset directories are present
if (!fs.existsSync(path.join(__dirname, "assets"))) {
  fs.mkdirSync(path.join(__dirname, "assets"));
  fs.mkdirSync(path.join(__dirname, "assets/profile_pics"));
}

const sessionOptions = {
  store: new SqliteStore({ db: "sessions.db", dir: "./assets" }), //Store sessions persitently across server restarts.
  secret: "Super secret string!!!! dont tell anyoneee",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    maxAge: 1000 * 60 * 15 // 15 minutes
  }
}

// Fills database with tables if they haven't been created yet.
await initDB();

// Add middleware.
app.use(express.json());
app.use(morgan('combined'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session(sessionOptions));
// Middlewares below add values to res.locals for routes to respond differently given auth conditions
app.param("id", checkIsLoggedInUser);
app.param("id", checkAreFriends);
app.param("id", checkShareCourses);

// Necessary to send CSS and client JS. Exposes some routes like /index.js that would normally be
// at /, but that poses no security risks and comes at no inconvenience to the end user,
// while keeping the server-side codebase fairly clean.
app.use(express.static("client"));

// == CLIENT ROUTES ==
app.get(basepath, (req, res) => {
  res.sendFile(path.join(__dirname, "client/index.html"));
});
app.get(`${basepath}/register`, (req, res) => {
  res.sendFile(path.join(__dirname, "client/register.html"));
});
app.get(`${basepath}/chat`, (req, res) => {
  res.sendFile(path.join(__dirname, "client/chat.html"));
});
app.get(`${basepath}/friends`, (req, res) => {
  res.sendFile(path.join(__dirname, "/client/friend-requests.html"));
});

app.get(`${basepath}/users`, async (req, res) => {
  // If logged in, redirect to own user's page.
  if (req.session.user) {
    res.redirect(`/users/${req.session.user.id}`);
  } else {
    res.redirect(`/`);
  }
});

app.get(`${basepath}/users/:id`, async (req, res) => {
  res.sendFile(path.join(__dirname, "client/profile.html"));
});

// == API ROUTES --
// User information
app.get(`${basepath}/api/users/:id`, [ 
  checkLoggedIn,
  param("id").trim().isInt().withMessage("Invalid user ID given.").toInt(),
], getUser);
app.get(`${basepath}/api/users/:id/friends`, [
  checkLoggedIn,
  param("id").trim().isInt().withMessage("Invalid user ID given.").toInt(),
], getFriends);
app.get(`${basepath}/api/users/:id/courses`, [
  checkLoggedIn,
  param("id").trim().isInt().withMessage("Invalid user ID given.").toInt(),
], getCourses);
app.get("/api/users/:id/:course_id/participants", [
  checkLoggedIn,
  param("id").trim().isInt().withMessage("Invalid user ID given.").toInt(),
  param("course_id").trim().isInt().withMessage("Invalid course ID given.").toInt(),
], getCourseParticipants);
app.get(`${basepath}/api/photo/:id`, [
  checkLoggedIn,
  param("id").trim().isInt().withMessage("Invalid user ID given.").toInt(),
], getProfilePhoto);

// Friends
app.post(`${basepath}/api/friend-requests/:id`, [
  checkLoggedIn,
  param("id").trim().isInt().withMessage("Invalid user ID given.").toInt(),
  body("action").trim().isString().notEmpty().withMessage("No action given."),
], updateFriendshipHandler);
app.get(`${basepath}/api/friend-requests`, [
  checkLoggedIn
], getFriendReqsHandler);
app.post(`${basepath}/api/friend-requests/:id/respond`, [
  checkLoggedIn,
  param("id").trim().isInt().withMessage("Invalid user ID given.").toInt(),
  body("action").trim().isString().notEmpty().withMessage("No action given."),
], respondFriendReqHandler);

// Account logic
app.post(`${basepath}/api/login`, [
  body("email").trim().isEmail().withMessage("Invalid email entered."),
  body("password").trim().notEmpty().withMessage("Invalid password entered."),
], loginRouteHandler);
app.post(`${basepath}/api/register`, [

], registerRouteHandler);
app.get(`${basepath}/api/currentUser`, [
  checkLoggedIn
], getLoggedInUser);
app.put(`${basepath}/api/users/:id/info`, [
  checkLoggedIn,
  param("id").trim().isInt().withMessage("Invalid user ID given.").toInt(),
], updateUserInfo);

// Chat
app.get(`${basepath}/api/chat/:id`, [
  checkLoggedIn,
  param("id").trim().isInt().withMessage("Invalid user ID given.").toInt(),
], getChatHandler);
app.post(`${basepath}/api/chat/:id`, [
  checkLoggedIn,
  param("id").trim().isInt().withMessage("Invalid user ID given.").toInt(),
  body("chat-input").trim().notEmpty().withMessage("Empty message entered.")
    .escape(), // Escaping message content to prevent XSS 
], sendMessageHandler);

app.listen(port, () => {
  console.log(`Application running on port ${port}.`);
});

process.on("close", () => {
  db.close();
})