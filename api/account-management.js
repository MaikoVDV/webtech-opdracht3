import { connectDB } from "../connect-database.js";
import { __dirname } from "../index.js";

import fs from "fs";
import path from "path";
import Busboy from "busboy";
import bcrypt from "bcrypt";

// Operates on /api/login
const getUserByEmailQuery = `
SELECT *
FROM Students
WHERE EMAIL = ?
`
export const loginRouteHandler = async (req, res) => {
  const db = await connectDB();
  const { email, password } = req.body;
  if (email == null || email == "") {
    res.status(401).json({error: "Please enter an e-mail address."});
    return;
  }
  if (password == null || password == "") {
    res.status(401).json({error: "Please enter a password."});
    return;
  }

  const user = await db.get(getUserByEmailQuery, email);

  if (user) {
    // Compare passwords
    if (await bcrypt.compare(password, user.password)) {
      // Correct password entered!
      console.log("Correct password entered!");

      req.session.user = {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
      }
      res.status(200).send();
    } else {
      res.status(401).json({error: "Incorrect combination of email and password."});
    }
  } else {
    res.status(401).json({error: "Incorrect combination of email and password."});
  }
};

const insertUserQuery = `
INSERT INTO Students (email, first_name, last_name, age, photo, password)
VALUES (?, ?, ?, ?, ?, ?);
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
      const hashedPassword = await bcrypt.hash(parsedData.password, 12);

      const photoname = `${Date.now()}-${photo.name}`;

      // Insert database entry
      const db = await connectDB();
      await db.run(insertUserQuery, [parsedData.email, parsedData.first_name, parsedData.last_name, parsedData.age, photoname, hashedPassword]);

      const getUserQuery = `SELECT * FROM Students WHERE email = ?;`;
      const userData = await db.get(getUserQuery, parsedData.email);

      req.session.user = {
        id: userData.id,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
      }

      // Safe photo to disk
      const savepath = path.join(__dirname, "assets", "profile_pics", photoname);
      fs.writeFile(savepath, photo.buffer, err => {
        if (err) {
          console.log(err);
          return res.status(500).json({error: "Failed to process submitted data."});
        }
      });

      res.status(200).send();
    } catch (exception) {
      console.log(exception);
      res.status(500).json({error: "Failed to register account."});
    }
  })
  req.pipe(busboy);

};

// Operates on /api/currentUser
const getUserByIdQuery = `
SELECT *
FROM Students
WHERE id = ?;
`
export const getLoggedInUser = async (req, res) => {
  if (req.session.user) {
    const db = await connectDB();
    // Querying user to not have to store entire user row in req.session and 
    // to maintain a single source of data (instead of req.session AND the database.)
    const user = await db.get(getUserByIdQuery, req.session.user.id);
    res.json(user);
  } else {
    res.status(401).json({ error: "Not logged in!"});
  }
}

export default { loginRouteHandler, registerRouteHandler };