import { connectDB } from "../connect-database.js";
// Operates on /api/friend-requests/:friend_id
export const addFriendHandler = async (req, res) => {
  res.json("Bazinga!" + req.params.friend_id);
}

// Operates on /api/friend-requests
// Returns received friend requests and send friend requests as separate objects.
const getReceivedFriendReqsQuery = `
  SELECT recs.user1_id AS id, s.first_name, s.last_name, recs.status
  FROM FriendRequests recs
  JOIN Students s ON recs.user1_id = s.id
  WHERE user2_id = ?;
`;
const getSentFriendReqsQuery = `
  SELECT recs.user2_id, s.first_name, s.last_name, s.photo, recs.status
  FROM FriendRequests recs
  JOIN Students s ON recs.user2_id = s.id
  WHERE user1_id = ?;
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