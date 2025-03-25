import { getLoggedInUser } from "./getLoggedinUser.js";
import { elementBuilder } from "./utils.js";

export const loadNavbarData = async () => {
  const user = await getLoggedInUser();

  const profileContainer = document.querySelector(".navbar__profile");
  profileContainer.appendChild(elementBuilder("a", {
    href: `/users/${user.first_name}`,
    textContent: user.first_name
  }));
}

loadNavbarData();