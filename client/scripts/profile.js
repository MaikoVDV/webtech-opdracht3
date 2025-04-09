import { elementBuilder } from "./utils.js";
import { openEditModal, closeEditModal, saveChanges, onPhotoButtonClick, onModalPhotoChange, displayDataInModalFields } from "./profile-modal.js";
import { getLoggedInUser } from "./account-management.js";

async function loadProfileData() {
  const userId = window.location.pathname.split('/').pop();
  const response = await fetch(`/api/users/${userId}`);
  const user = await response.json();

  const loggedInUser = await getLoggedInUser();
  if (!loggedInUser) return;

  if (userId != loggedInUser.id) {
    const profileEditButton = document.querySelector(".profile__button-edit");
    profileEditButton.style.display = "none";
  };

  const nameHeader = document.querySelector(".profile__fullname");
  nameHeader.textContent = `${user.first_name} ${user.last_name}`;

  document.querySelector("#email-display").textContent = `E-mail: ${user.email}`;
  document.querySelector("#age-display").textContent = `Age: ${user.age}`;
  document.querySelector("#hobbies-display").textContent = `Hobbies: ${user.hobbies ?? ""}`;
  document.querySelector("#program-display").textContent = `Program: ${user.program}`;

  const pictureDisplay = document.querySelector(".profile__picture");
  pictureDisplay.src = `/api/photo/${userId}`;

  displayDataInModalFields(user);

  document.querySelector(".profile__button-edit").addEventListener("click", openEditModal);
  document.querySelector(".modal__button-close").addEventListener("click", closeEditModal);
  document.querySelector(".form__button#cancel").addEventListener("click", closeEditModal);
  document.querySelector("#input-photo").addEventListener("change", onModalPhotoChange);
  document.querySelector(".form__button#save").addEventListener("click", saveChanges);
  document.querySelector(".form__button").addEventListener("click", onPhotoButtonClick);


  const friendsContainer = document.querySelector("#friends-container");
  const friendsQuery = await fetch(`/api/users/${userId}/friends`);
  const friends = await friendsQuery.json();

  const friendsHeader = document.querySelector(".profile__sec-header#friends");
  friendsHeader.textContent += ` (${friends.length})`;

  for (const friend of friends) {
    let friendItem = friendsContainer.appendChild(elementBuilder("li", {
      class: "profile__list-item"
    }));
    friendItem.appendChild(elementBuilder("p", {
      textContent: friend.first_name
    }));
  };

  const coursesContainer = document.querySelector("#courses-container");
  const coursesQuery = await fetch(`/api/users/${userId}/courses`);
  const courses = await coursesQuery.json();

  const coursesHeader = document.querySelector(".profile__sec-header#courses");
  coursesHeader.textContent += ` (${courses.length})`;


  for (const course of courses) {
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
  };
}
loadProfileData();