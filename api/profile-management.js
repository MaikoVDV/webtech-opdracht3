import { connectDB } from "../connect-database.js";

export async function updateUserInfo(req, res) {
  const db = await connectDB();
  const { id } = req.params;

  const values = Object.values(req.body);
  values.push(id);

  const query = `
  UPDATE Students
  SET first_name = ?, last_name = ?, email = ?, age = ?, photo = ?, hobbies = ?, program = ?, courses = ? 
  WHERE id = ?;
  `;

  const userData = await db.all(query, values).catch((error) => {
    console.log(error);
    res.status(500).json({ error: "Failed to update user information." });
    return;
  });

  res.json(userData);
}