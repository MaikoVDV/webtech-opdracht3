import { onPhotoButtonClick, onModalPhotoChange } from "./profile-modal.js";

// Registers click event handlers for buttons in the registry form
async function loadRegisterForm() {
  document.querySelector("#input-photo").addEventListener("change", onModalPhotoChange);
  document.querySelector(".form__button").addEventListener("click", onPhotoButtonClick);
}
loadRegisterForm();