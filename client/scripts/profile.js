import { elementBuilder } from "./utils.js";
import { openEditModal, closeEditModal, saveChanges, onPhotoButtonClick, onModalPhotoChange, displayDataInModalFields } from "./profile-modal.js";
import { getLoggedInUser } from "./account-management.js";

async function loadProfileData() {
  const userId = window.location.pathname.split('/').pop();
  const response = await fetch(`/api/users/${userId}`);
  if (response.status == 401) {
    // Request not authorized, ask user to log in again.
    return window.location.href = "/";
  }
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
  const profileModal = document.querySelector(".modal#profile");

  profileModal.querySelector(".modal__button-close").addEventListener("click", closeEditModal);
  profileModal.querySelector(".form__button#cancel").addEventListener("click", closeEditModal);
  profileModal.querySelector("#input-photo").addEventListener("change", onModalPhotoChange);
  profileModal.querySelector(".form__button#save").addEventListener("click", saveChanges);
  profileModal.querySelector(".form__button").addEventListener("click", onPhotoButtonClick);


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
      class: "profile__list-item course-item",
      "course": course.id
    }));
    courseItem.appendChild(elementBuilder("p", {
      class: "course-item__name",
      textContent: course.name
    }));
  };

  const courseItems = document.querySelectorAll(".course-item");
  const courseModal = document.querySelector(".modal#course");

  const modalCloseButton = courseModal.querySelector(".modal__button-close");
  const modalTitle = courseModal.querySelector(".modal__title");
  const modalDescription = courseModal.querySelector(".modal__description");
  const modalTeacher = courseModal.querySelector(".modal__teacher");
  const modalStudents = courseModal.querySelector(".modal__students");

  for (const item of courseItems) {
    item.addEventListener('click', async () => {
      const courseId = parseInt(item.getAttribute("course"));

      modalTitle.textContent = courses[courseId - 1].name;
      modalDescription.textContent = courses[courseId - 1].description;
      modalTeacher.textContent = `${courses[courseId - 1].teacher_first_name} ${courses[courseId - 1].teacher_last_name}`;

      const participantsQuery = await fetch(`/api/users/${userId}/${courseId}/participants`);
      const participants = await participantsQuery.json();

      modalStudents.innerHTML = '';
      for (const participant of participants) {
        const userQuery = await fetch(`/api/users/${participant.student_id}`);
        const user = await userQuery.json();

        const studentElement = document.createElement("li");
        studentElement.appendChild(elementBuilder("img", {
          src: `/api/photo/${user.id}`,
          alt: `Photo of ${user.first_name}`
        }));
        studentElement.appendChild(elementBuilder("a", {
          textContent: `${user.first_name} ${user.last_name}`,
          href: `/users/${user.id}`
        }));
        modalStudents.appendChild(studentElement);
      };

      courseModal.style.display = "block";
      document.body.classList.add("modal--visible");
    });
  };

  modalCloseButton.addEventListener("click", () => {
    courseModal.style.display = "none";
    document.body.classList.remove("modal--visible");
  });
}
loadProfileData();
