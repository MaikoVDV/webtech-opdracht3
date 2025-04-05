let loggedInUserData;
export const getLoggedInUser = async () => {
  if (loggedInUserData) {
    return loggedInUserData;
  }
  const response = await fetch(`/api/currentUser`);
  const user = await response.json();
  if (user) {
    loggedInUserData = user;
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

        const res = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });

        if (res.ok) {
          // Login was successful
          window.location.replace("/users/");
        } else {
          // Login was unsuccessful, display error message.
          const result = await res.json();
          loginForm.querySelector(".profile-form__error-message").textContent = result.error;
        }
      });
    } catch (exception) {}
  }
  if (window.location.pathname == "/register") {
    try {
      const registerForm = document.getElementById("register-form");
      registerForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const formData = new FormData(registerForm);
        // const data = Object.fromEntries(formData.entries());
        // console.log("Submitted!");

        const res = await fetch("/api/register", {
          method: "POST",
          // headers: { "Content-Type": "multipart/form-data" },
          body: formData
        });

        console.log(res);
        if (res.ok) {
          // Login was successful
          // window.location.replace("/users/");
        } else {
          // Login was unsuccessful, display error message.
          const result = await res.json();
          registerForm.querySelector(".profile-form-error__message").textContent = result.error;
        }
      });
    } catch (exception) { }
  }
});