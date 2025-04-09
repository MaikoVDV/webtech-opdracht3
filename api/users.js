import path from "path";
import { validationResult } from "express-validator"; // Validating user data and preventing XSS

import { __dirname } from "../index.js";
import { connectDB } from "../connect-database.js";

// Operates on /api/users/:id
const userQuery = `
  SELECT id, email, first_name, last_name, age, hobbies, program, courses
  FROM Students
  WHERE id = ?;
`;
const checkFriendRequestsSent = `
  SELECT 1
  FROM FriendRequests
  WHERE sender_id = ? AND target_id = ?;
`;
export const getUser = async (req, res) => {
  const db = await connectDB();
  const userId = req.session.user.id;
  const targetId = req.params.id;
  const targetUser = await db.get(userQuery, targetId);
  if (!targetUser) {
    return res.status(404).json({ error: "Couldn't find user." });
  }
  // Return full data on user's own profile
  if (res.locals.checkIsLoggedInUser) {
    let responseObj = targetUser;
    responseObj.areFriends = false;
    responseObj.shareCourses = false;
    return res.json(responseObj);
  }
  // Return full data on user's friend
  if (res.locals.checkAreFriends) {
    let responseObj = targetUser;
    responseObj.areFriends = res.locals.checkAreFriends;
    responseObj.shareCourses = res.locals.checkShareCourses;
    return res.json(responseObj);
  }
  // Return partial data on user's classmates
  if (res.locals.checkShareCourses) {
    let responseObj = {
      id: targetUser.id,
      first_name: targetUser.first_name,
      last_name: targetUser.last_name,
      areFriends: res.locals.checkAreFriends,
      shareCourses: res.locals.checkShareCourses,
    };

    // Check if this user or the target user sent a friend request
    const userSentRequest = await db.get(checkFriendRequestsSent, [userId, targetId]);
    if (userSentRequest) {
      responseObj.userSentRequest = userSentRequest["1"] == 1;
    } else {
      responseObj.userSentRequest = false;
    }
    const userReceivedRequest = await db.get(checkFriendRequestsSent, [targetId, userId]);
    if (userReceivedRequest) {
      responseObj.userReceivedRequest = userReceivedRequest["1"] == 1;
    } else {
      responseObj.userReceivedRequest = false;
    }
    return res.json(responseObj);
  }
  // Didn't pass any friendship / same course check, so pretend this user does not exist
  return res.status(404).json({ error: "Couldn't find user." });
};

// Operates on /api/photo/:id
export const getProfilePhoto = async (req, res) => {
  const validationRes = validationResult(req);
  if (!validationRes.isEmpty()) {
    return res.status(400).json({ error: "Failed to access profile photo, invalid student id given." });
  }

  // Check if user is authorized to see this student's photo
  if (!(res.locals.checkIsLoggedInUser || res.locals.checkShareCourses || res.locals.checkAreFriends)) {
    return res.status(404).json({ error: "Couldn't find user." });
  }

  try {
    const db = await connectDB();
    const { id } = req.params;
    let pictureQuery = await db.get(`SELECT photo FROM Students WHERE id = ?`, id);
    return res.sendFile(path.join(__dirname, `assets/profile_pics/${pictureQuery.photo ? pictureQuery.photo : "default.png"}`));
  } catch (e) {
    console.error(`Failed to serve profile photo: ${e}`);
    res.status(500).json({ error: "Failed to get the user's photo due to an unknown error. Please try again later."});
  }
}

// Operates on /api/users/:id/friends
export const getFriends = async (req, res) => {
  // Check if user is authorized to see this student's friends
  if (!(res.locals.checkIsLoggedInUser || res.locals.checkAreFriends)) {
    return res.status(404).json({ error: "Couldn't find user." });
  }

  const db = await connectDB();
  const { id } = req.params;
  const friends = await db.all(`
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
    [id, id, id, id, id]);

  return res.status(200).json(friends);
};

// Operates on /api/users/:id/courses
export const getCourses = async (req, res) => {
  if (!(res.locals.checkIsLoggedInUser || res.locals.checkAreFriends)) {
    return res.status(404).json({ error: "Couldn't find user. " });
  }
  const db = await connectDB();
  const id = req.params.id;
  const course = await db.all(`
    SELECT *
    FROM Courses
    JOIN CourseParticipants ON Courses.id=CourseParticipants.course_id
    WHERE CourseParticipants.student_id = ?;`,
    [id]);
  return res.json(course);
};