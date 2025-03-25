import { connectDB, initDB } from "./connect-database.js";
import { loginRouteHandler, registerRouteHandler, getLoggedInUser } from "./api/account-management.js";
import { getUser, getProfilePhoto, getFriends } from "./api/users.js";

import express from "express";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";
import bodyParser from "body-parser"; // For easier parsing of request bodies, like form data.
import { param, query, validationResult } from "express-validator"; // Validating user data and preventing XSS

export const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 8010;
const sessionOptions = {
  secret: "Super secret string!!!! dont tell anyoneee",
  cookie: {
    secure: false,
    maxAge: 60000
  }
}

// Fills database with tables if they haven't been created yet.
await initDB();

// Add middleware.
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session(sessionOptions));
app.use(express.static("client"));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "client/index.html"));
});

app.get("/users", async (req, res) => {
  // If logged in, redirect to own user's page.
  if (req.session.user) {
    console.log("logged in as " + req.session.user.first_name);
    res.redirect(`/users/${req.session.user.id}`);
  } else {
    // TODO: Handle case where user visits /users but is not logged in
    console.warn("User visited /users but is not logged in!");
    res.send("Not logged in!")
  }
});

app.get("/users/:id", async (req, res) => {
  res.sendFile(path.join(__dirname, "client/profile.html"));
});
app.get("/api/users/:id", getUser);
app.get("/api/users/:id/friends", getFriends);
app.get("/api/photo/:id", getProfilePhoto);


// app.get("/api/users/:id/friends", (req, res) => {
//   console.log("friends: " + req.params.username);
//   res.sendFile(path.join(__dirname, "client/friends.html"));
// });

app.post("/api/login", loginRouteHandler);
app.post("/api/register", registerRouteHandler);
app.get("/api/currentUser", getLoggedInUser);

// Debug routes - ff verwijderen voor inlevering.
app.get("/api/debug/all-users", async (req, res) => {
  const db = await connectDB();
  const result = await db.all("SELECT * FROM Students");
  res.json(result);
});

app.listen(port, () => {
  console.log(`Application running on port ${port}.`);
});

process.on("close", () => {
  db.close();
})