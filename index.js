const path = require("path");
const express = require("express");
const bodyParser = require("body-parser"); // For easier parsing of request bodies, like form data.
const { param, query, validationResult } = require("express-validator");

const fs = require("fs");
const dbFile = "database.db";
const exists = fs.existsSync(dbFile);
if (!exists) {
  fs.openSync(dbFile, "w");
}

const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database(dbFile);

const app = express();
const port = 8010;

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS Students (
    id             integer         PRIMARY KEY AUTOINCREMENT,
    first_name     VARCHAR(32)     NOT NULL,
    last_name      VARCHAR(32)     NOT NULL
    );
  `);

  // const addStudentsStmt = db.prepare(`
  //   INSERT INTO Students (first_name, last_name)
  //   VALUES
  //   (?, ?)
  // `);
  // addStudentsStmt.run("Maiko", "van der Veen");
  // addStudentsStmt.run("Bessel", "Withoos");
})

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "client")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "index.html"));
});
app.get("/users/:username", (req, res) => {
  console.log("users: " + req.params.username);
  res.sendFile(path.join(__dirname, "client", "profiles", "profile.html"));
});

app.get("/users/:username/friends", (req, res) => {
  console.log("friends: " + req.params.username);
  res.sendFile(path.join(__dirname, "client", "profiles", "profile.html"));
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  res.send("Hi " + username);
});

app.get("/profile", (req, res) => {
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