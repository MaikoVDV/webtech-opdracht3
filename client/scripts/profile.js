import { elementBuilder } from "./utils.js";

async function loadProfileData() {
  const userId = window.location.pathname.split('/').pop(); // Get username from URL
  const response = await fetch(`/api/users/${userId}`);
  const user = await response.json();

  const nameHeader = document.querySelector(".profile__fullname");
  nameHeader.textContent = `${user.first_name} ${user.last_name}`;

  document.querySelector("#email-display").textContent = `E-mail: ${user.email}`;
  document.querySelector("#age-display").textContent = `Age: ${user.age}`;

  const pictureDisplay = document.querySelector(".profile__picture");
  pictureDisplay.src = `/api/photo/${userId}`;

  const friendsContainer = document.querySelector("#friends-container");
  const friendsQuery = await fetch(`/api/users/${userId}/friends`);
  const friends = await friendsQuery.json();

  friends.forEach(friend => {
    console.log(friend);
    let friendItem = friendsContainer.appendChild(elementBuilder("li", {
      class: "profile__list-item"
    }));
    friendItem.appendChild(elementBuilder("p", {
      textContent: friend.first_name
    }));
  });
}
loadProfileData();