import { connectDB } from "../connect-database.js";

// Operates on /api/login/:email
export const loginRouteHandler = async (req, res) => {
  const db = await connectDB();
  const { email, password } = req.body;
  const user = await db.get("SELECT * FROM Students WHERE email = ?", email);

  if (user) {
    req.session.user = {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
    }
    // res.send("Last name is" + user.last_name);
    res.redirect(`/users/${user.id}`);
  } else {
    // TODO: Handle failed login
  }
};

export const registerRouteHandler = (req, res) => {
  const { username, password } = req.body;
  res.send("Hi " + username);
};

// Operates on /api/currentUser
export const getLoggedInUser = async (req, res) => {
  if (req.session.user) {
    const db = await connectDB();
    // Querying user to not have to store entire user row in req.session and 
    // to maintain a single source of data (instead of req.session AND the database.)
    const user = await db.get("SELECT * FROM Students WHERE id = ?", req.session.user.id);
    res.json(user);
  }
}

export default { loginRouteHandler, registerRouteHandler };