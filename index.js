import { initDB, SqliteStore } from "./connect-database.js";
import { loginRouteHandler, registerRouteHandler, getLoggedInUser, checkLoggedIn } from "./api/account-management.js";
import { getUser, getProfilePhoto, getFriends, getCourses } from "./api/users.js";
import { addFriendHandler, getFriendReqsHandler } from "./api/friends.js";
import { getChatHandler, sendMessageHandler } from "./api/chat.js";

import fs from "fs";
import express from "express";
import session from "express-session";
import bcrypt from "bcrypt";
import path from "path";
import { fileURLToPath } from "url";
import bodyParser from "body-parser"; // For easier parsing of request bodies, like form data.
import { body, check, param, validationResult } from "express-validator"; // Validating user data and preventing XSS

export const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 8010;

// Make sure asset directories are present
if (!fs.existsSync(path.join(__dirname, "assets"))) {
  fs.mkdirSync(path.join(__dirname, "assets"));
  fs.mkdirSync(path.join(__dirname, "assets/profile_pics"));
}

const sessionOptions = {
  store: new SqliteStore({ db: "sessions.db", dir: "./assets"}), //Store sessions persitently across server restarts.
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
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session(sessionOptions));

// Necessary to send CSS and client JS. Exposes some routes like /index.js that would normally be
// at /, but that poses no security risks and comes at no inconvenience to the end user,
// while keeping the server-side codebase fairly clean.
app.use(express.static("client")); 

// == CLIENT ROUTES ==
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "client/index.html"));
});
app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "client/register.html"));
});
app.get("/chat", (req, res) => {
  res.sendFile(path.join(__dirname, "client/chat.html"));
});
app.get("/friends", (req, res) => {
  res.sendFile(path.join(__dirname, "/client/friend-requests.html"));
});

app.get("/users", async (req, res) => {
  // If logged in, redirect to own user's page.
  if (req.session.user) {
    res.redirect(`/users/${req.session.user.id}`);
  } else {
    // TODO: Handle case where user visits /users but is not logged in
    console.warn("User visited /users but is not logged in!");
    res.send(req.session);
    // res.send("Not logged in!");
  }
});

app.get("/users/:id", async (req, res) => {
  res.sendFile(path.join(__dirname, "client/profile.html"));
});

// == API ROUTES --
// User information
app.get("/api/users/:id", checkLoggedIn, getUser);
app.get("/api/users/:id/friends", checkLoggedIn, getFriends);
app.get("/api/users/:id/courses", checkLoggedIn, getCourses);
app.get("/api/photo/:id", [ /// TODO: ADD FRIENDSHIP / SAME COURSE CHECK
  checkLoggedIn,
  param("id").trim().notEmpty().isInt()
], getProfilePhoto);

// Friends
app.post("/api/friend-requests/:target_id", [
  checkLoggedIn,
  param("friend_id").trim().notEmpty().isInt()
], addFriendHandler);
app.get("/api/friend-requests", checkLoggedIn, getFriendReqsHandler);

// Account logic
app.post("/api/login", [
  body("email").trim().isEmail(),
  body("password").trim().isAscii()
], loginRouteHandler);
app.post("/api/register", registerRouteHandler);
app.get("/api/currentUser", checkLoggedIn, getLoggedInUser);

// Chat
app.get("/api/chat/:friend_id", [
  checkLoggedIn,
  param("friend_id").trim().notEmpty()
], getChatHandler);
app.post("/api/chat/:friend_id", [
  checkLoggedIn,
  body("chat-input").trim().notEmpty(), // The message content
  param("friend_id").trim().notEmpty().isInt() // The message's recipient
], sendMessageHandler);

app.listen(port, () => {
  console.log(`Application running on port ${port}.`);
});

process.on("close", () => {
  db.close();
})