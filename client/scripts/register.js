import { onPhotoButtonClick, onModalPhotoChange } from "./profile-modal.js";

async function loadRegisterForm() {
  document.querySelector("#input-photo").addEventListener("change", onModalPhotoChange);
  document.querySelector(".form__button").addEventListener("click", onPhotoButtonClick);
}
loadRegisterForm();