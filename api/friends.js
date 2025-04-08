import { connectDB } from "../connect-database.js";
// Operates on /api/friend-requests/:friend_id
export const addFriendHandler = async (req, res) => {
  res.json("Bazinga!" + req.params.friend_id);
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

// Operates on /api/friend-requests/:sender_id/respond
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
  const otherId = req.params.sender_id;
  const action = req.body.action;
  console.log(`User: ${userId}, Sender: ${otherId}`);

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