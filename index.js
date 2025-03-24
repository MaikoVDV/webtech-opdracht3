import { loginRouteHandler, registerRouteHandler } from "./profile-management.js";
import { connectDB, initDB } from "./connect-database.js";

import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import bodyParser from "body-parser"; // For easier parsing of request bodies, like form data.
import { param, query, validationResult } from "express-validator";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 8010;

// Fills database with tables if they haven't been created yet.
await initDB();

// Add middleware.
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("client"));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "client/index.html"));
});
app.get("/users/:username", async (req, res) => {
  const db = await connectDB();

  try {
    const user = await db.get(`SELECT * FROM Students WHERE first_name = ?`, req.params.username);
    if (user) {
      res.json(user);
    } else {
      res.send(`Couldn't find any user with name ${req.params.username}`);
    }
  } catch {
    console.log(`An unknown error occurred while querying database for user with name ${req.params.username}`);
  }
});

app.get("/users/:username/friends", (req, res) => {
  console.log("friends: " + req.params.username);
  res.sendFile(path.join(__dirname, "client/profiles/friends.html"));
});

app.post("/login", loginRouteHandler);
app.post("/register", registerRouteHandler);

app.get("/profile", async (req, res) => {
  const db = await connectDB();
  const result = await db.all('SELECT * FROM Students');
  res.json(result);
});


app.listen(port, () => {
  console.log(`Application running on port ${port}.`);
});

process.on("close", () => {
  db.close();
})