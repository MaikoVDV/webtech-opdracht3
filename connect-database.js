import sqlite3 from "sqlite3";
import session from "express-session";
import SqliteStoreFactory from "connect-sqlite3";
import { open } from "sqlite";

const dbFile = "database.db";
export const SqliteStore = SqliteStoreFactory(session);

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
      photo          VARCHAR(255), --The ID of a given photo. References photos stored in /assets/profile_pics/[ID]
      password	     CHAR(60),
      hobbies        TEXT,
      program        VARCHAR(100),
      courses        TEXT
      );

      CREATE UNIQUE INDEX IF NOT EXISTS idx_Students_email ON Students(email);

      CREATE TABLE IF NOT EXISTS Friends (
      first_id       INTEGER          NOT NULL,
      second_id      INTEGER          NOT NULL,
      date_added     TEXT             DEFAULT (CURRENT_DATE),
      PRIMARY KEY (first_id, second_id) 
      );

      CREATE TABLE IF NOT EXISTS FriendRequests (
      sender_id      INTEGER          NOT NULL,
      target_id      INTEGER          NOT NULL,
      status         VARCHAR(32)      DEFAULT 'pending',
      PRIMARY KEY (sender_id, target_id),
      FOREIGN KEY (sender_id) REFERENCES Students(id),
      FOREIGN KEY (target_id) REFERENCES Students(id),
      CHECK (status IN ('pending', 'accepted', 'rejected'))
      );

      CREATE TABLE IF NOT EXISTS Courses (
      id                   INTEGER          PRIMARY KEY AUTOINCREMENT,
      name                 VARCHAR(256)     NOT NULL,
      description          TEXT,
      teacher_first_name   VARCHAR(32)  NOT NULL,
      teacher_last_name    VARCHAR(32)  NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS CourseParticipants (
      course_id    INTEGER     NOT NULL,
      student_id   INTEGER     NOT NULL, 
      PRIMARY KEY (course_id, student_id)
      );

      CREATE TABLE IF NOT EXISTS Conversations (
      id          INTEGER      PRIMARY KEY AUTOINCREMENT,
      user1_id    INTEGER      NOT NULL,
      user2_id    INTEGER      NOT NULL,
      FOREIGN KEY (user1_id) REFERENCES Students(id),
      FOREIGN KEY (user2_id) REFERENCES Students(id),
      CONSTRAINT unique_conversation UNIQUE (user1_id, user2_id)
      );

      CREATE TABLE IF NOT EXISTS Messages (
      id          INTEGER        PRIMARY KEY AUTOINCREMENT,
      convo_id    INTEGER        NOT NULL,
      sender_id   INTEGER        NOT NULL,
      content     VARCHAR(1024)  NOT NULL,
      sent_at     DATETIME       DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (convo_id) REFERENCES Conversations(id),
      FOREIGN KEY (sender_id) REFERENCES Students(id)
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
