import { getLoggedInUser } from "./account-management.js";
import { elementBuilder } from "./utils.js";

export const loadNavbarData = async () => {
  const user = await getLoggedInUser();

  const profileContainer = document.querySelector(".navbar__profile");
  profileContainer.appendChild(elementBuilder("a", {
    href: `/users/${user.id}`,
    textContent: `${user.first_name} ${user.last_name}`
  }));
}

loadNavbarData();