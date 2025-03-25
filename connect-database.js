import sqlite3 from "sqlite3";
import { open } from "sqlite";
const dbFile = "database.db";


// Returns a connection to the database. Connection is closed automatically when variable is garbage collected.
export async function connectDB() {
  return open({
    filename: dbFile,
    driver: sqlite3.Database
  });
}

// Fill the database with tables if they're not present yet. Runs on server startup.
export async function initDB() {
  const db = await connectDB();


  await db.exec(`
      CREATE TABLE IF NOT EXISTS Students (
      id             INTEGER         PRIMARY KEY AUTOINCREMENT,
      email          VARCHAR(255)    UNIQUE NOT NULL,
      first_name     VARCHAR(32)     NOT NULL,
      last_name      VARCHAR(32)     NOT NULL,
      age            INTEGER,
      photo          VARCHAR(255) --The ID of a given photo. References photos stored in /assets/profile_pics/[ID]
      );

      CREATE UNIQUE INDEX IF NOT EXISTS idx_Students_email ON Students(email);

      CREATE TABLE IF NOT EXISTS Friends (
      first_id       INTEGER          NOT NULL,
      second_id      INTEGER          NOT NULL,
      date_added     TEXT             DEFAULT (CURRENT_DATE),
      PRIMARY KEY (first_id, second_id) 
      );
    `);
}

// export async function connectDB() { 
//   if (dbInstance) {
//     console.log("dbInstance exists.");
//     return dbInstance;
//   } else {
//     console.log("dbInstance does not exist.");

//   }

//   const exists = fs.existsSync(dbFile);
//   if (!exists) {
//     fs.openSync(dbFile, "w");
//   }

//   dbInstance = new sqlite3.Database(dbFile);

//   dbInstance.serialize(() => {
//     dbInstance.run(`
//       CREATE TABLE IF NOT EXISTS Students (
//       id             integer         PRIMARY KEY AUTOINCREMENT,
//       first_name     VARCHAR(32)     NOT NULL,
//       last_name      VARCHAR(32)     NOT NULL
//       );
//     `);

//   return dbInstance;

//     // const addStudentsStmt = db.prepare(`
//     //   INSERT INTO Students (first_name, last_name)
//     //   VALUES
//     //   (?, ?)
//     // `);
//     // addStudentsStmt.run("Maiko", "van der Veen");
//     // addStudentsStmt.run("Bessel", "Withoos");
//   });
// };
