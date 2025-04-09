import { connectDB } from "../connect-database.js";
import { __dirname } from "../index.js";

import fs from "fs";
import path from "path";
import Busboy from "busboy";
import bcrypt from "bcrypt";

// Operates on /api/login
// Responds to user's login requests by matching email and (hashed)password
const getUserByEmailQuery = `
SELECT *
FROM Students
WHERE EMAIL = ?
`
export const loginRouteHandler = async (req, res) => {
  const db = await connectDB();
  const { email, password } = req.body;
  if (email == null || email == "") {
    res.status(401).json({ error: "Please enter an e-mail address." });
    return;
  }
  if (password == null || password == "") {
    res.status(401).json({ error: "Please enter a password." });
    return;
  }

  const user = await db.get(getUserByEmailQuery, email);

  if (user) {
    // Compare passwords
    if (await bcrypt.compare(password, user.password)) {
      req.session.user = {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
      }
      res.status(200).send();
    } else {
      res.status(401).json({ error: "Incorrect combination of email and password." });
    }
  } else {
    res.status(401).json({ error: "Incorrect combination of email and password." });
  }
};

// Operates on /api/register
// Uses busboy to parse the mixed form data (json and binary image data)
// Field validation handled on route definition by middleware.
// Handles adding Students to the database.
const insertUserQuery = `
INSERT INTO Students (email, first_name, last_name, age, photo, password, hobbies, program, courses)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
`;
const uniqueEmailQuery = `
SELECT 1
FROM Students
WHERE email = ?;
`;
export const registerRouteHandler = async (req, res) => {
  const busboy = Busboy({ headers: req.headers });

  // Process multipart form data with busboy - necessary because data consists of text as well as image data.
  let parsedData = {};
  let photo = {};
  busboy.on("field", (fieldname, value) => {
    parsedData[fieldname] = value;
  });
  busboy.on("file", (fieldname, file, metadata) => {
    if (fieldname === "photo") {
      // Safe photo in memory until other fields have been processed.
      let photoData = [];
      file.on("data", (chunk) => {
        photoData.push(chunk);
      });
      file.on("end", () => {
        photo.buffer = Buffer.concat(photoData);
        photo.name = metadata.filename;
      });
    }
  });

  // After form data processing is finished, update the database.
  busboy.on("finish", async () => {
    try {
      const db = await connectDB();

      // Check if a user already exists with the given email address
      const user = await db.get(uniqueEmailQuery, parsedData.email);
      if (user) {
        if (user["1"] == 1) {
          return res.status(409).json({ error: "The given email address is already in use." });
        }
      }

      const hashedPassword = await bcrypt.hash(parsedData.password, 12);

      let photoname = null;
      if (photo.buffer) {
        photoname = `${Date.now()}-${photo.name}`;
        // Safe photo to disk
        const savepath = path.join(__dirname, "assets", "profile_pics", photoname);
        fs.writeFile(savepath, photo.buffer, err => {
          if (err) {
            console.error(err);
            return res.status(500).json({ error: "Failed to process submitted data." });
          }
        });
      }

      // Insert database entry
      await db.run(insertUserQuery, [parsedData.email, parsedData.first_name, parsedData.last_name, parsedData.age, photoname, hashedPassword, parsedData.hobbies, parsedData.program, parsedData.courses]);

      const getUserQuery = `SELECT * FROM Students WHERE email = ?;`;
      const userData = await db.get(getUserQuery, parsedData.email);

      req.session.user = {
        id: userData.id,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
      }


      res.status(200).send();
    } catch (exception) {
      console.error(exception);
      res.status(500).json({ error: "Failed to register account." });
    }
  })
  req.pipe(busboy);

};

// Operates on /api/currentUser
// Checks the user's session for it's id and returns the user data matching it
const getUserByIdQuery = `
SELECT *
FROM Students
WHERE id = ?;
`
export const getLoggedInUser = async (req, res) => {
  const db = await connectDB();
  // Querying user to not have to store entire user row in req.session and 
  // to maintain a single source of data (instead of req.session AND the database.)
  const user = await db.get(getUserByIdQuery, req.session.user.id);
  return res.status(200).json(user);
}

// Middleware to protect routes that should only be accessible for logged-in users.
export const checkLoggedIn = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  return res.status(401).json({error: "Failed to process request, not logged in."});
}

// Middleware to check if the user that sent the request is just the user that was requested.
// Doesn't *really* need to be implemented as middleware, but this approach preserves consitency
// with other route protection strategies (checkSameCourses, express-validator middlewares, etc.)
export const checkIsLoggedInUser = async (req, res, next, id) => {
  try {
    const userId = req.session.user.id;
    const otherId = id;
    res.locals.checkIsLoggedInUser = userId == otherId;
  } catch {
    res.locals.checkIsLoggedInUser = false;
  }
  return next();
}

// Middleware to protect routes that should only be accessible for users that share a course with the other user
// Assumes the user is logged in
const checkSameCourseQuery = `
SELECT cp1.course_id
FROM CourseParticipants cp1
JOIN CourseParticipants cp2
ON cp2.course_id = cp1.course_id
WHERE cp1.student_id = ? AND cp2.student_id = ?
`;
const basicUserQuery = `
SELECT first_name, last_name
FROM Students
WHERE id = ?;
`;
export const checkShareCourses = async (req, res, next, id) => {
  try {
    const userId = req.session.user.id;
    const otherId = id;
    const db = await connectDB();
    const sharedCourses = await db.all(checkSameCourseQuery, [userId, otherId]);

    res.locals.checkShareCourses = sharedCourses.length > 0;
  } catch {
    res.locals.checkShareCourses = false;
  }
  return next();
}

// Middleware to protect routes that should only be accessible for users that are friends with the given other student
// Assumes the user is logged in
const checkFriendshipQuery = `
    SELECT 1
    FROM Friends f
    JOIN Students s1 ON f.user1_id = s1.id
    JOIN Students s2 ON f.user2_id = s2.id
    WHERE (f.user1_id = ? AND f.user2_id = ?) OR (f.user1_id = ? AND f.user2_id = ?);
`;
export const checkAreFriends = async (req, res, next, id) => {
  let out = false;
  try {
    const userId = req.session.user.id;
    const otherId = id;
    const db = await connectDB();
    const friendshipCheck = await db.get(checkFriendshipQuery, [userId, otherId, otherId, userId]);
    if (friendshipCheck) {
      out = friendshipCheck["1"] == 1;
    }
  } catch {
    out = false;
  }
  res.locals.checkAreFriends = out;
  return next();
}