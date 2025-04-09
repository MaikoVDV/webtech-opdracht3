import { connectDB } from "../connect-database.js";

// PUTs changes to a user's account into the database. Is called by the profile update modal.
export async function updateUserInfo(req, res) {
  const db = await connectDB();
  const { id } = req.params;

  const values = Object.values(req.body);
  values.push(id);

  const query = `
  UPDATE Students
  SET first_name = ?, last_name = ?, email = ?, age = ?, hobbies = ?, program = ?, courses = ? 
  WHERE id = ?;
  `;
  console.log(req.body);

  await db.run(query, values).catch((error) => {
    console.log(error);
    res.status(500).json({ error: "Failed to update user information." });
    return;
  });

  res.status(200).json({ message: "User information updated successfully." });
}