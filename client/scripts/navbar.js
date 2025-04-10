import { getLoggedInUser } from "./account-management.js";
import { elementBuilder, routePatcher } from "./utils.js";

// Adds a link to the user's profile in the top-right of the navbar,
// with the user's name fetched from the server.
export const loadNavbarData = async () => {
  const user = await getLoggedInUser();
  if (!user) return;

  const profileContainer = document.querySelector(".navbar__profile");
  profileContainer.appendChild(elementBuilder("a", {
    href: routePatcher(`users/${user.id}`),
    textContent: `${user.first_name} ${user.last_name}`
  }));
}

loadNavbarData();