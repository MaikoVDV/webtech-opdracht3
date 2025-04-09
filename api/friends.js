import { connectDB } from "../connect-database.js";

// Operates on /api/friend-requests/:id
const sendFriendRequestQuery = `
  INSERT INTO FriendRequests (sender_id, target_id)
  VALUES (?, ?);
`;
const removeFriendQuery = `
  DELETE FROM Friends
  WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?);
`;
const clearSentFriendRequests = `
  DELETE FROM FriendRequests
  WHERE (sender_id = ? AND target_id = ?) OR (sender_id = ? AND target_id = ?);
`
export const updateFriendshipHandler = async (req, res) => {
  const userId = req.session.user.id;
  const targetId = req.params.id;
  const action = req.body.action;
  try {
    if (userId == targetId) {
      return res.status(400).json({ error: "Can't send a friend request to yourself." });
    }
    if (!res.locals.checkShareCourses) {
      return res.status(404).json({ error: "User not found." });
    }

    const db = await connectDB();

    switch (action) {
      case "add":
        await db.run(sendFriendRequestQuery, [userId, targetId]);
        break;
      case "remove":
        await db.run(removeFriendQuery, [userId, targetId, targetId, userId]);
        await db.run(clearSentFriendRequests, [userId, targetId, targetId, userId]);
        break;
      default:
        return res.status(400).json({ error: "Sent a friend request with an unknown action." });
    }
    return res.status(200).send();
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to send friend request due to an unknown server error. Please try again later."});
  }
}

// Operates on /api/friend-requests
// Returns received friend requests and send friend requests as separate objects.
const getReceivedFriendReqsQuery = `
  SELECT recs.sender_id AS id, s.first_name, s.last_name, recs.status
  FROM FriendRequests recs
  JOIN Students s ON recs.sender_id = s.id
  WHERE target_id = ?;
`;
const getSentFriendReqsQuery = `
  SELECT recs.target_id, s.first_name, s.last_name, s.photo, recs.status
  FROM FriendRequests recs
  JOIN Students s ON recs.target_id = s.id
  WHERE sender_id = ?;
`;
export const getFriendReqsHandler = async (req, res) => {
  const db = await connectDB();
  const userId = req.session.user.id;

  const received = await db.all(getReceivedFriendReqsQuery, [userId]);
  const sent = await db.all(getSentFriendReqsQuery, [userId]);
  return res.status(200).json( {
    received: received,
    sent: sent,
  });
}

// Operates on /api/friend-requests/:id/respond
const checkFriendRequestStatusQuery = `
  SELECT status
  FROM FriendRequests
  WHERE sender_id = ? AND target_id = ?;
`;
const updateFriendRequestQuery = `
  UPDATE FriendRequests
  SET status = ?
  WHERE sender_id = ? AND target_id = ?;
`;
const addFriendQuery = `
  INSERT INTO Friends (user1_id, user2_id)
  VALUES (?, ?);
`;
export const respondFriendReqHandler = async (req, res) => {
  const db = await connectDB();
  const userId = req.session.user.id;
  const otherId = req.params.id;
  const action = req.body.action;

  // Prevent accepting your own friend request. Not really necessary given constraints on sending friend requests,
  // but an extra security check is never a bad idea. :)
  if (res.locals.checkIsLoggedInUser) {
    res.status(400).json({ error: "Can't repond to your own friend request." });
  }

  const requestStatus = await db.get(checkFriendRequestStatusQuery, [otherId, userId]);
  if (requestStatus.status != "pending") {
    // Request has already been closed (or does not exist at all)
    res.status(400).json({error: "Cannot respond to friend request. No pending friend request exists between these students."});
  }
  
  try {
    switch (action) {
      case "reject":
          await db.run(updateFriendRequestQuery, ["rejected", otherId, userId]);
          return res.status(200).send();
      case "accept":
          await db.run(updateFriendRequestQuery, ["accepted", otherId, userId]);
          await db.run(addFriendQuery, [otherId, userId]);
          return res.status(200).send();
      default:
        return res.status(400).json({error: "Failed to update friend request: invalid action given."});
    }
  } catch (e) {
    console.error(e);
    return res.status(400).json({error: "Failed to respond to friend request."});
  }
}