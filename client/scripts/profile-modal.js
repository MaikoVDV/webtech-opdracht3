export function openEditModal() {
  document.querySelector(".modal").style.display = "block";
  document.body.classList.add("modal--visible");
}

export function closeEditModal() {
  document.querySelector(".modal").style.display = "none";
  document.body.classList.remove("modal--visible");
}

export function onPhotoButtonClick() {
  document.querySelector(".modal__form input#photo").click();
}

export async function saveChanges() {
  const userId = window.location.pathname.split('/').pop(); // Get username from URL

  const firstName = document.querySelector(".modal__form input#first-name").value.trim();
  const lastName = document.querySelector(".modal__form input#last-name").value.trim();
  const email = document.querySelector(".modal__form input#email").value.trim();
  const age = parseInt(document.querySelector(".modal__form input#age").value.trim(), 10);
  const photo = document.querySelector(".modal__form input#photo").files[0];
  const hobbies = document.querySelector(".modal__form input#hobbies").value.trim();
  const program = document.querySelector(".modal__form select#program").value;
  const courses = Array.from(document.querySelectorAll(".modal__form .form__checkbox-list input:checked")).map(
    checkbox => checkbox.value
  );

  if (!firstName || !lastName) {
    showNotification("First and last names cannot be empty.", "error");
    return;
  };
  if (!validateEmail(email)) {
    showNotification("Please enter a valid email address.", "error");
    return;
  };
  if (!age || age <= 0) {
    showNotification("Please enter a valid age greater than 0.", "error");
    return;
  };

  console.log("Saved details:", { firstName, lastName, email, age, program, hobbies, courses });
  console.log("Photo:", photo ? photo.name : "No photo uploaded");

  const body = {
    firstName: firstName,
    lastName: lastName,
    email: email,
    age: age,
    photo: photo ? photo.name : null,
    hobbies: hobbies,
    program: program,
    courses: courses.join(", ")
  };

  const response = await fetch(`/api/users/${userId}/info`, {
    method: "PUT",
    body: body
  });
  const responseObj = await response.json();
  console.log(responseObj);

  closeEditModal();
  showNotification("Changes saved successfully. Reload the page to see the updated profile.", "success");
};

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

function showNotification(message, type) {
  const notification = document.querySelector(".notification");
  notification.innerText = message;
  notification.style.backgroundColor = type === "success" ? "#4caf50" : "#f44336";
  notification.style.display = "block";

  setTimeout(() => {
    notification.style.display = "none";
  }, 3000);
};

