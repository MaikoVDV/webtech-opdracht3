import { connectDB } from "../connect-database.js";
import { validationResult } from "express-validator";

// Operates on /api/chat/:id
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
  const validationErrors = validationResult(req);
  if (!validationErrors.isEmpty()) {
    return res.status(401).json({error: validationErrors.array()});
  }
  if (res.locals.checkIsLoggedInUser) {
    return res.status(400).json({ error: "You can't chat with yourself. "});
  }
  if (!res.locals.checkAreFriends) {
    return res.status(404).json({ error: "User not found. "});
  }

  try {
    const db = await connectDB();
    const userId = req.session.user.id;
    const friendId = req.params.id;

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
  const validationErrors = validationResult(req);
  if (!validationErrors.isEmpty()) {
    return res.status(400).json({error: validationErrors.array()});
  }

  if (res.locals.checkIsLoggedInUser) {
    return res.status(400).json({ error: "You can't chat with yourself. "});
  }
  if (!res.locals.checkAreFriends) {
    return res.status(404).json({ error: "User not found. "});
  }

  try {
    const userId = req.session.user.id;
    const friendId = req.params.id;
    const messageContent = req.body["chat-input"]; // Validated inside middleware

    const db = await connectDB();

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