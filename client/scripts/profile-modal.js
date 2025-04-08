export function openEditModal() {
  document.querySelector(".modal").style.display = "block";
  document.body.classList.add("modal--visible");
}

export function closeEditModal() {
  document.querySelector(".modal").style.display = "none";
  document.body.classList.remove("modal--visible");
}

export function onPhotoButtonClick() {
  document.querySelector(".modal__form input#input-photo").click();
}

export async function saveChanges() {
  const userId = window.location.pathname.split('/').pop(); // Get username from URL

  const firstName = document.querySelector(".modal__form input#first-name").value.trim();
  const lastName = document.querySelector(".modal__form input#last-name").value.trim();
  const email = document.querySelector(".modal__form input#email").value.trim();
  const age = parseInt(document.querySelector(".modal__form input#age").value.trim(), 10);
  const photo = document.querySelector(".modal__form input#input-photo").files[0];
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

  const body = {
    firstName: firstName,
    lastName: lastName,
    email: email,
    age: age,
    photo: photo ? photo.name : null,
    hobbies: hobbies ? hobbies : null,
    program: program ? program : null,
    courses: courses ? courses.join(", ") : null
  };

  await fetch(`/api/users/${userId}/info`, {
    method: "PUT",
    headers: { "Content-type": "application/json" },
    body: JSON.stringify(body)
  });

  closeEditModal();
  showNotification("Changes saved successfully. Reload the page to see the updated profile.", "success");
};

export function displayDataInModalFields(user) {

};

export function onModalPhotoChange(input) {
  const file = input.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const preview = document.querySelector(".form__photo-preview");
      preview.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };
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

