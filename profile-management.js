export const loginRouteHandler = (req, res) => {
  const { username, password } = req.body;
  res.send("Hi " + username);
};

export const registerRouteHandler = (req, res) => {
  const { username, password } = req.body;
  res.send("Hi " + username);
};

export default { loginRouteHandler, registerRouteHandler };