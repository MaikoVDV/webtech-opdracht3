let loggedInUserData;
export const getLoggedInUser = async () => {
  if (loggedInUserData) {
    return loggedInUserData;
  }
  const response = await fetch(`/api/currentUser`);
  const user = await response.json();
  if (user) {
    loggedInUserData = user;
  }
  return loggedInUserData;
}