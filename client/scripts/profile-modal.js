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

export function saveChanges() {
  const firstName = document.getElementById("first-name").value.trim();
  const lastName = document.getElementById("last-name").value.trim();
  const email = document.getElementById("email").value.trim();
  const age = parseInt(document.getElementById("age").value.trim(), 10);
  const photo = document.getElementById("photo").files[0]; // Get the selected file
  const program = document.getElementById("program").value;
  const hobbies = document.getElementById("hobbies").value.trim();
  const courses = Array.from(document.querySelectorAll('input[name="courses"]:checked')).map(
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

