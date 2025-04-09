import { elementBuilder } from "./utils.js";
import { openEditModal, closeEditModal, saveChanges, onPhotoButtonClick, onModalPhotoChange, displayDataInModalFields } from "./profile-modal.js";
import { getLoggedInUser } from "./account-management.js";

/* 
Responsible for loading all profile data of the given user. 
Also adds content to the profile editing modal and course view modal. 
*/

// Loads the profile data of the user on this route.
async function loadProfileData() {
  const userId = window.location.pathname.split('/').pop(); // Get user id from URL
  const response = await fetch(`/api/users/${userId}`);
  if (response.status == 401) {
    // Request not authorized, ask user to log in again.
    return window.location.href = "/";
  }
  const user = await response.json();

  const loggedInUser = await getLoggedInUser();
  if (!loggedInUser) return;

  // Check if the user is on his/her own profile page
  const profileEditButton = document.querySelector(".profile__button-edit");
  profileEditButton.addEventListener("click", openEditModal);
  if (userId == loggedInUser.id) {
    profileEditButton.style.display = "block";
  };
  // Add remove friend button (invisible when user is not friends with the logged-in user.)
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
  // Add friend button (invisible when user is not taking the same course as the logged-in user.)
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

  document.querySelector(".profile__button-edit").addEventListener("click", openEditModal);
  const profileModal = document.querySelector(".modal#profile");

  profileModal.querySelector(".modal__button-close").addEventListener("click", closeEditModal);
  profileModal.querySelector(".form__button#cancel").addEventListener("click", closeEditModal);
  profileModal.querySelector("#input-photo").addEventListener("change", onModalPhotoChange);
  profileModal.querySelector(".form__button#save").addEventListener("click", saveChanges);
  profileModal.querySelector(".form__button").addEventListener("click", onPhotoButtonClick);

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
      friendItem.appendChild(elementBuilder("a", {
        textContent: friend.first_name,
        href: `/users/${friend.id}`
      }));
    });
  }


  // Display the student's taken courses
  const coursesQuery = await fetch(`/api/users/${userId}/courses`);
  if (coursesQuery.ok) {
    const coursesContainer = document.querySelector("#courses-container");
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

}
loadProfileData();
