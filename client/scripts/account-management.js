let loggedInUserData;
export const getLoggedInUser = async () => {
  if (loggedInUserData) {
    return loggedInUserData;
  }
  const response = await fetch(`/api/currentUser`);
  const user = await response.json();
  if (response.ok) {
    loggedInUserData = user;
  } else {
    return null;
  }
  return loggedInUserData;
}

window.addEventListener("load", () => {
  if (window.location.pathname == "/") {
    try {
      const loginForm = document.getElementById("login-form");
      loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const formData = new FormData(loginForm);
        const data = Object.fromEntries(formData.entries());

        const res = await fetch("../api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });

        if (res.ok) {
          // Login was successful
          window.location.replace("users/");
        } else {
          // Login was unsuccessful, display error message.
          const result = await res.json();
          loginForm.querySelector(".profile-form__error-message").textContent = result.error;
        }
      });
    } catch (exception) { }
  }
  if (window.location.pathname == "/register") {
    try {
      const registerForm = document.querySelector(".form__button#submit");
      registerForm.addEventListener("click", async () => {

        const jsonData = getRegisterFormData();
        if (!jsonData) return;

        const formData = new FormData();
        for (const key in jsonData) {
          if (Array.isArray(jsonData[key])) {
            jsonData[key].forEach((item, index) => {
              formData.append(`${key}[${index}]`, item);
            });
          } else {
            formData.append(key, jsonData[key]);
          };
        };

        const res = await fetch("/api/register", {
          method: "POST",
          body: formData
        });

        if (res.ok) {
          // Login was successful
          window.location.replace("/users/");
        } else {
          // Login was unsuccessful, display error message.
          const result = await res.json();
          showNotification(result.error, "error");
        }
      });
    } catch (exception) { }
  }
});

function getRegisterFormData() {
  const form = document.querySelector(".register__form");

  const first_name = form.querySelector("#first-name").value.trim();
  const last_name = form.querySelector("#last-name").value.trim();
  const email = form.querySelector("#email").value.trim();
  const password = form.querySelector("#password").value;
  const age = parseInt(form.querySelector("#age").value.trim(), 10);
  const photo = form.querySelector("#input-photo").files[0];
  const hobbies = form.querySelector("#hobbies").value.trim();
  const program = form.querySelector("#program").value;
  const courses = Array.from(form.querySelectorAll(".form__checkbox-list input:checked"))
    .map(checkbox => checkbox.value);

  const passwordCheck = validatePassword(password);

  if (!passwordCheck.valid) return showNotification(passwordCheck.errors.join("\n"), "error");
  if (!first_name || !last_name) return showNotification("First and last names cannot be empty.", "error");
  if (!validateEmail(email)) return showNotification("Please enter a valid email address.", "error");
  if (!age || age <= 0) return showNotification("Please enter a valid age greater than 0.", "error");

  const body = {
    first_name,
    last_name,
    email,
    password,
    age,
    photo: photo || "",
    hobbies: hobbies || null,
    program: program,
    courses: courses.length ? courses.join(", ") : null,
  };

  return body;
};

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

function validatePassword(password) {
  const errors = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long.");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter.");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter.");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one digit.");
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Password must contain at least one special character.");
  }

  return errors.length === 0
    ? { valid: true, message: "Password is valid." }
    : { valid: false, errors: errors };
}

function showNotification(message, type) {
  const notification = document.querySelector(".notification");
  notification.innerText = message;
  notification.style.backgroundColor = type === "success" ? "#4caf50" : "#f44336";
  notification.style.display = "block";

  setTimeout(() => {
    notification.style.display = "none";
  }, 3000);
};