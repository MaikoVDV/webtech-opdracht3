import fs from "fs";
import sqlite3 from "sqlite3";
const dbFile = "database.db";

let dbInstance;

export async function connectDB() { 
  if (dbInstance) {
    console.log("dbInstance exists.");
    return dbInstance;
  } else {
    console.log("dbInstance does not exist.");

  }

  const exists = fs.existsSync(dbFile);
  if (!exists) {
    fs.openSync(dbFile, "w");
  }

  dbInstance = new sqlite3.Database(dbFile);

  dbInstance.serialize(() => {
    dbInstance.run(`
      CREATE TABLE IF NOT EXISTS Students (
      id             integer         PRIMARY KEY AUTOINCREMENT,
      first_name     VARCHAR(32)     NOT NULL,
      last_name      VARCHAR(32)     NOT NULL
      );
    `);

  return dbInstance;

    // const addStudentsStmt = db.prepare(`
    //   INSERT INTO Students (first_name, last_name)
    //   VALUES
    //   (?, ?)
    // `);
    // addStudentsStmt.run("Maiko", "van der Veen");
    // addStudentsStmt.run("Bessel", "Withoos");
  });
};
