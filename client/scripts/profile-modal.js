// Opens the modal
export function openEditModal() {
  document.querySelector(".modal").style.display = "block";
  document.body.classList.add("modal--visible");
}

// Closes the modal
export function closeEditModal() {
  document.querySelector(".modal").style.display = "none";
  document.body.classList.remove("modal--visible");
}

// Helper function for passing click event to the correct element.
export function onPhotoButtonClick() {
  document.querySelector("input#input-photo").click();
}

// Pushes profile edits to the server
export async function saveChanges() {
  const userId = window.location.pathname.split('/').pop();
  const response = await fetch(`/api/users/${userId}`);
  const user = await response.json();

  const form = document.querySelector(".modal__form");

  const first_name = form.querySelector("#first-name").value.trim();
  const last_name = form.querySelector("#last-name").value.trim();
  const email = form.querySelector("#email").value.trim();
  const age = parseInt(form.querySelector("#age").value.trim(), 10);
  const photo = form.querySelector("#input-photo").files[0];
  const hobbies = form.querySelector("#hobbies").value.trim();
  const program = form.querySelector("#program").value;
  const courses = Array.from(form.querySelectorAll(".form__checkbox-list input:checked"))
    .map(checkbox => checkbox.value);

  if (!first_name || !last_name) return showNotification("First and last names cannot be empty.", "error");
  if (!validateEmail(email)) return showNotification("Please enter a valid email address.", "error");
  if (!await uniqueEmail(email)) return showNotification("The email address entered is already in use.", "error");
  if (!age || age <= 0) return showNotification("Please enter a valid age greater than 0.", "error");

  const body = {
    first_name,
    last_name,
    email,
    age,
    photo: photo?.name || user.photo,
    hobbies: hobbies || null,
    program: program,
    courses: courses.length ? courses.join(", ") : null,
  };

  try {
    const response = await fetch(`/api/users/${userId}/info`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) throw new Error("Failed to update user information.");

    closeEditModal();
    showNotification("Changes saved successfully. Reload the page to see the updated profile.", "success");
  } catch (error) {
    console.error(error);
    showNotification("An error occurred while saving changes.", "error");
  };
};

// Displays the current user data (fetched from the server in another function) in the profile modal as default values
export function displayDataInModalFields(user) {
  const form = document.querySelector(".modal__form");

  form.querySelector("#first-name").value = user.first_name || "";
  form.querySelector("#last-name").value = user.last_name || "";
  form.querySelector("#email").value = user.email || "";
  form.querySelector("#age").value = user.age || "";

  const photoPreview = form.querySelector(".form__photo-preview");
  if (user.photo) {
    photoPreview.src = `/api/photo/${user.id}`;
    photoPreview.style.display = "block";
  } else {
    photoPreview.src = "";
    photoPreview.style.display = "none";
  }

  form.querySelector("#hobbies").value = user.hobbies || "";
  form.querySelector("#program").value = user.program || "";

  const coursesCheckboxes = form.querySelectorAll(".form__checkbox-list input[type='checkbox']");
  coursesCheckboxes.forEach(checkbox => {
    checkbox.checked = user.courses?.includes(checkbox.value) || false;
  });
};

// Shows the uploaded photo in the modal
export function onModalPhotoChange(input) {
  const file = input.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const preview = document.querySelector(".form__photo-preview");
      preview.src = e.target.result;
      preview.style.display = "block";
    };
    reader.readAsDataURL(file);
  };
};

// Helper function to validate the entered email address
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/* Validates the user's entered password for 
  * being at least 8 characters long
  * containing at least one uppercase character
  * a number
  * a special character
*/
function showNotification(message, type) {
  const notification = document.querySelector(".notification");
  notification.innerText = message;
  notification.style.backgroundColor = type === "success" ? "#4caf50" : "#f44336";
  notification.style.display = "block";

  setTimeout(() => {
    notification.style.display = "none";
  }, 3000);
};