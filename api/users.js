import path from "path";

import { __dirname } from "../index.js";
import { connectDB } from "../connect-database.js";

// Operates on /api/users/:id
const userQuery = `
  SELECT id, email, first_name, last_name, age, photo
  FROM Students
  WHERE id = ?;
`;
export const getUser = async (req, res) => {
  const db = await connectDB();
  const { id } = req.params;
  const user = await db.get(userQuery, id);
  if (!user) {
    return res.status(404).json({error: "Couldn't find user."});
  }

  res.json(user);
};

// Operates on /api/photo/:id
export const getProfilePhoto = async (req, res) => {
  const db = await connectDB();
  const { id } = req.params;
  let pictureQuery = await db.get(`SELECT photo FROM Students WHERE id = ?`, id);
  res.sendFile(path.join(__dirname, `assets/profile_pics/${pictureQuery.photo}`));
}

// Operates on /api/users/:id/friends
export const getFriends = async (req, res) => {
  const db = await connectDB();
  const { id } = req.params;
  const user = await db.all(`
    SELECT DISTINCT
    CASE
      WHEN f.user1_id = ? THEN s2.id
      ELSE s1.id
    END AS id,

    CASE
      WHEN f.user1_id = ? THEN s2.first_name
      ELSE s1.first_name
    END AS first_name,

    CASE
      WHEN f.user1_id = ? THEN s2.last_name
      ELSE s1.last_name
    END AS last_name

    FROM Friends f
    JOIN Students s1 ON f.user1_id = s1.id
    JOIN Students s2 ON f.user2_id = s2.id
    WHERE f.user1_id = ? OR f.user2_id = ?;`,
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