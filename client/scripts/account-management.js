/*
Responsible for getting data on the currently logged-in user, 
and for adding functionality to the login- and register forms.
*/

import { routePatcher } from "./utils.js";

let loggedInUserData;
// Fetch the logged in user, and save it in loggedInUserData so subsequent fetches aren't necessary
export const getLoggedInUser = async () => {
  if (loggedInUserData) {
    return loggedInUserData;
  }
  const response = await fetch(routePatcher(`api/currentUser`));
  const user = await response.json();
  if (response.ok) {
    loggedInUserData = user;
  } else {
    return null;
  }
  return loggedInUserData;
}

window.addEventListener("load", () => {
  const windowPath = window.location.pathname.split('/');
  const finalPartOfPath = windowPath[windowPath.length - 1];
  // When on the root route, try to add functionality to the login form.
  if (finalPartOfPath == "") {
    try {
      const loginForm = document.getElementById("login-form");
      loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const formData = new FormData(loginForm);
        const data = Object.fromEntries(formData.entries());

        const res = await fetch(routePatcher("api/login"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });

        if (res.ok) {
          // Login was successful
          window.location.replace(routePatcher("users"));
        } else {
          // Login was unsuccessful, display error message.
          const result = await res.json();
          loginForm.querySelector(".profile-form__error-message").textContent = result.error;
        }
      });
    } catch (exception) { }
  }

  // When on the registry route, try to add functionality to the register form.
  if (finalPartOfPath == "register") {
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

        const res = await fetch(routePatcher("api/register"), {
          method: "POST",
          body: formData
        });

        if (res.ok) {
          // Login was successful
          window.location.replace(routePatcher("users"));
        } else {
          // Login was unsuccessful, display error message.
          const result = await res.json();
          showNotification(result.error, "error");
        }
      });
    } catch (exception) { }
  }
});

// Gets all the values in the register form and validates certain fields to prevent unwanted inputs.
// These validations are of course also carried out on the server, this just saves network traffic.
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

// Validates the user's entered email using a regex string.
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

// Displays a notification regarding registry success or an error message.
function showNotification(message, type) {
  const notification = document.querySelector(".notification");
  notification.innerText = message;
  notification.style.backgroundColor = type === "success" ? "#4caf50" : "#f44336";
  notification.style.display = "block";

  setTimeout(() => {
    notification.style.display = "none";
  }, 3000);
};