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
  const userId = window.location.pathname.split('/').pop();
  const response = await fetch(`/api/users/${userId}`);
  const user = await response.json();

  const form = document.querySelector(".modal__form");

  const firstName = form.querySelector("#first-name").value.trim();
  const lastName = form.querySelector("#last-name").value.trim();
  const email = form.querySelector("#email").value.trim();
  const age = parseInt(form.querySelector("#age").value.trim(), 10);
  const photo = form.querySelector("#input-photo").files[0];
  const hobbies = form.querySelector("#hobbies").value.trim();
  const program = form.querySelector("#program").value;
  const courses = Array.from(form.querySelectorAll(".form__checkbox-list input:checked"))
    .map(checkbox => checkbox.value);

  if (!firstName || !lastName) return showNotification("First and last names cannot be empty.", "error");
  if (!validateEmail(email)) return showNotification("Please enter a valid email address.", "error");
  if (!age || age <= 0) return showNotification("Please enter a valid age greater than 0.", "error");

  const body = {
    firstName,
    lastName,
    email,
    age,
    photo: photo?.name || user.photo,
    hobbies: hobbies || null,
    program: program || null,
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

