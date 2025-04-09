import { elementBuilder } from "./utils.js";
import { openEditModal, closeEditModal, saveChanges, onPhotoButtonClick, onModalPhotoChange, displayDataInModalFields } from "./profile-modal.js";
import { getLoggedInUser } from "./account-management.js";

async function loadProfileData() {
  const userId = window.location.pathname.split('/').pop(); // Get user id from URL
  const response = await fetch(`/api/users/${userId}`);
  const user = await response.json();

  const loggedInUser = await getLoggedInUser();
  if (!loggedInUser) return;

  // Check if the user is on his/her own profile page
  const profileEditButton = document.querySelector(".profile__button-edit");
  profileEditButton.addEventListener("click", openEditModal);
  if (userId == loggedInUser.id) {
    profileEditButton.style.display = "block";
  };
  const removeFriendButton = document.querySelector(".profile__button-remove-friend");
  removeFriendButton.addEventListener("click", async () => {
    await fetch(`/api/friend-requests/${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "remove"
      })
    });
    window.location.reload();
  })
  if (user.areFriends) {
    removeFriendButton.style.display = "block";
  }
  const addFriendButton = document.querySelector(".profile__button-add-friend");
  addFriendButton.addEventListener("click", async () => {
    await fetch(`/api/friend-requests/${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "add"
      })
    });
    window.location.reload();
  })
  if (!user.areFriends && user.shareCourses) {
    addFriendButton.style.display = "block";
    // Currently logged-in user has sent a friend request, but its still pending.
    if (user.userSentRequest) {
      addFriendButton.textContent = "Friend request pending..."
      addFriendButton.setAttribute("disabled", true);
    }
  }

  const nameHeader = document.querySelector(".profile__fullname");
  nameHeader.textContent = `${user.first_name} ${user.last_name}`;

  document.querySelector("#email-display").textContent = `E-mail: ${user.email}`;
  document.querySelector("#age-display").textContent = `Age: ${user.age}`;
  document.querySelector("#hobbies-display").textContent = `Hobbies: ${user.hobbies ?? ""}`;
  document.querySelector("#program-display").textContent = `Program: ${user.program}`;

  const pictureDisplay = document.querySelector(".profile__picture");
  pictureDisplay.src = `/api/photo/${userId}`;

  displayDataInModalFields(user);

  // Add interactivity to profile edit popup
  document.querySelector(".modal__button-close").addEventListener("click", closeEditModal);
  document.querySelector(".form__button#cancel").addEventListener("click", closeEditModal);
  document.querySelector("#input-photo").addEventListener("change", onModalPhotoChange);
  document.querySelector(".form__button#save").addEventListener("click", saveChanges);
  document.querySelector(".form__button").addEventListener("click", onPhotoButtonClick);

  // Display the student's friends
  const friendsQuery = await fetch(`/api/users/${userId}/friends`);
  if (friendsQuery.ok) {
    const friendsContainer = document.querySelector("#friends-container");
    const friends = await friendsQuery.json();

    const friendsHeader = document.querySelector(".profile__sec-header#friends");
    friendsHeader.textContent += ` (${friends.length})`;
    
    friends.forEach(friend => {
      let friendItem = friendsContainer.appendChild(elementBuilder("li", {
        class: "profile__list-item"
      }));
      friendItem.appendChild(elementBuilder("p", {
        textContent: friend.first_name
      }));
    });
  }


  // Display the student's taken courses
  const coursesQuery = await fetch(`/api/users/${userId}/courses`);
  if (coursesQuery.ok) {
    const coursesContainer = document.querySelector("#courses-container");
    const courses = await coursesQuery.json();
    courses.forEach(course => {
      let courseItem = coursesContainer.appendChild(elementBuilder("li", {
        class: "profile__list-item course-item"
      }));
      courseItem.appendChild(elementBuilder("p", {
        class: "course-item__name",
        textContent: course.name
      }));

      let courseDetails = courseItem.appendChild(elementBuilder("div", {
        class: "profile__list-item--subsection",
      }));
      courseDetails.appendChild(elementBuilder("p", {
        class: "course-item__description",
        textContent: course.description
      }));
      courseDetails.appendChild(elementBuilder("p", {
        class: "course-item__teacher",
        textContent: `${course.teacher_first_name} ${course.teacher_last_name}`
      }));
      courseDetails.appendChild(elementBuilder("button", {
        class: "course-item__participants-button",
        textContent: `${course.teacher_first_name} ${course.teacher_last_name}`
      }));
    });
  }
}
loadProfileData();