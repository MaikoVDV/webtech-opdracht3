import { connectDB } from "../connect-database.js";
import { validationResult } from "express-validator";

// Operates on /api/chat/:friend_id
const checkFriendshipQuery = `
    SELECT 1
    FROM Friends f
    JOIN Students s1 ON f.user1_id = s1.id
    JOIN Students s2 ON f.user2_id = s2.id
    WHERE (f.user1_id = ? AND f.user2_id = ?) OR (f.user1_id = ? AND f.user2_id = ?);
`;
const getConvoQuery = `
  SELECT id
  FROM Conversations
  WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?);
`;
const getMessagesQuery = `
  SELECT sender_id, content, sent_at
  FROM Messages
  WHERE convo_id = ?
  ORDER BY sent_at DESC;
`;
export const getChatHandler = async (req, res) => {
  if (req.session.user == null) {
    return res.status(401).json({error: "Failed to access chat data, not logged in."});
  }
  const validationRes = validationResult(req);
  if (!validationRes.isEmpty()) {
    return res.status(401).json({error: "Failed to access chat data, not logged in."});
  }

  try {
    const userId = req.session.user.id;
    const friendId = req.params.friend_id;

    // Check if users are friends
    const db = await connectDB();
    const friendCheckQuery = await db.get(checkFriendshipQuery, [userId, friendId, friendId, userId]);
    if (!friendCheckQuery) {
      return res.status(401).json({error: "You are not friends with this user!"});
    }

    // Check if a conversation exists between the students.
    // If not, create one.
    {
      const convoQuery = await db.get(getConvoQuery, userId, friendId, friendId, userId);
      if (!convoQuery) {
        // Create a conversation
        const createConvoQuery = `
          INSERT INTO Conversations (user1_id, user2_id)
          VALUES (?, ?);
        `;
        await db.run(createConvoQuery, [userId, friendId]);
      }
    }
    // Given the code block above, we can always expect a returned value here.
    const convoQuery = await db.get(getConvoQuery, [userId, friendId, friendId, userId]);

    // Get all messages belonging to the conversation.
    const messageQuery = await db.all(getMessagesQuery, [convoQuery.id]);

    res.json(messageQuery);
  } catch (e) {
    console.error(e);
    res.status(500).json({error: "Failed to access chat."});
  }
}

const sendMessageQuery = `
  INSERT INTO Messages (convo_id, sender_id, content)
  VALUES (?, ?, ?);
`;
export const sendMessageHandler = async (req, res) => {
  if (req.session.user == null) {
    return res.status(401).json({error: "Failed to access chat data, not logged in."});
  }
  const validationRes = validationResult(req);
  if (!validationRes.isEmpty()) {
    return res.status(400).json({error: "Invallid message."});
  }

  try {
    const userId = req.session.user.id;
    const friendId = req.params.friend_id;
    const messageContent= req.body["chat-input"];

    // Check if message is valid
    if (messageContent == "") return res.status(406).json({error: "Message has no content."});
    // Check if users are friends
    const db = await connectDB();
    const friendCheckQuery = await db.get(checkFriendshipQuery, [userId, friendId, friendId, userId]);
    if (!friendCheckQuery["1"]) {
      return res.status(401).json({error: "You are not friends with this user!"});
    }

    const convoQuery = await db.get(getConvoQuery, [userId, friendId, friendId, userId]);
    if (!convoQuery) {
      return res.status(404).json({error: "No conversation exists between these users."});
    }

    // Add the message to the database.
    await db.run(sendMessageQuery, [convoQuery.id, userId, messageContent]);

    res.status(200).send();
  } catch (e) {
    console.error(e);
    res.status(500).json({error: "Failed to access chat."});
  }
}