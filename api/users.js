import path from "path";

import { __dirname } from "../index.js";
import { connectDB } from "../connect-database.js";

// Operates on /api/users/:id
export const getUser = async (req, res) => {
  const db = await connectDB();
  const { id } = req.params;
  const user = await db.get("SELECT * FROM Students WHERE id = ?", id);

  res.json(user);
};

// Operates on /api/photo/:id
export const getProfilePhoto = async (req, res) => {
  const db = await connectDB();
  const { id } = req.params;
  let pictureQuery = await db.get(`SELECT photo FROM Students WHERE id = ?`, id);

  res.sendFile(path.join(__dirname, `assets/profile_pics/${pictureQuery.photo ? pictureQuery.photo : "default.png"}`));
}

// Operates on /api/users/:id/friends
export const getFriends = async (req, res) => {
  const db = await connectDB();
  const { id } = req.params;
  const user = await db.all(`
   SELECT DISTINCT
    CASE
      WHEN f.first_id = ? THEN s2.first_name
      WHEN f.second_id = ? THEN s1.first_name
    END AS first_name
    FROM Friends f
    JOIN
      Students s1 ON f.first_id = s1.id
    JOIN
      Students s2 ON f.second_id = s2.id
    WHERE
      f.first_id = ? OR f.second_id = ?;`,
    [id, id, id, id]);
  res.json(user);
};

// Operates on /api/users/:id/courses
export const getCourses = async (req, res) => {
  const db = await connectDB();
  const { id } = req.params;
  const course = await db.all(`
    SELECT *
    FROM Courses
    JOIN CourseParticipants ON Courses.id=CourseParticipants.course_id
    WHERE CourseParticipants.student_id = ?;`,
    [id]);
  res.json(course);
};