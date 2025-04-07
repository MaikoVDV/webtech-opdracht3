export const addFriendHandler = async (req, res) => {
  res.json("Bazinga!" + req.params.friend_id);
}