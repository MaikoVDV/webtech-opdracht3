import { loginRouteHandler, registerRouteHandler } from "./profile-management.js";
import { connectDB } from "./connect-database.js";

import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import bodyParser from "body-parser"; // For easier parsing of request bodies, like form data.
import { param, query, validationResult } from "express-validator";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 8010;

const db = await connectDB();
console.log(db);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("client"));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "client/index.html"));
});
app.get("/users/:username", (req, res) => {
  console.log("users: " + req.params.username);
  res.sendFile(path.join(__dirname, "client/profiles/profile.html"));
});

app.get("/users/:username/friends", (req, res) => {
  console.log("friends: " + req.params.username);
  res.sendFile(path.join(__dirname, "client/profiles/friends.html"));
});

app.post("/login", loginRouteHandler);
app.post("/register", registerRouteHandler);

app.get("/profile", (req, res) => {
  console.log(db);
  db.all('SELECT * FROM Students', [], (err, rows) => {
    if (err) {
        res.status(500).json({ error: err.message });
        return;
    }
    res.json(rows);
});
});


app.listen(port, () => {
  console.log(`Application running on port ${port}.`);
});

process.on("close", () => {
  db.close();
})