import { elementBuilder } from "./utils.js";
import { getLoggedInUser } from "./account-management.js";

let currentOpenFriend = null;

window.addEventListener("load", async () => {
  // Check if logged in
  const user = await getLoggedInUser();
  if (!user) return window.location.href = "/";

  // Get list of friends
  const friendsContainer = document.querySelector(".friends-list");
  const friendsQuery = await fetch(`/api/users/${user.id}/friends`);
  const friends = await friendsQuery.json();

  friends.forEach(friend => {
    const friendEntry = elementBuilder("li", { class: "friends-list__item" });
    friendEntry.appendChild(elementBuilder("img", { class: "friends-list__photo", src: `/api/photo/${friend.id}` }));
    friendEntry.appendChild(elementBuilder("p", { class: "friends-list__name", textContent: `${friend.first_name} ${friend.last_name}` }));
    friendEntry.addEventListener("click", () => {
      Array.from(friendsContainer.children).forEach(child => {
        child.classList.remove("friends-list__item--selected");
      })
      friendEntry.classList.add("friends-list__item--selected");
      openChat(friend.id);
    });
    friendsContainer.appendChild(friendEntry);
  });

  // Handling message sending
  const inputForm = document.querySelector(".current-chat__input");
  inputForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const msgInputData = new FormData(inputForm);
    const msg = Object.fromEntries(msgInputData.entries());
    const postMsgQuery = await fetch(`/api/chat/${currentOpenFriend.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(msg)
    });
    if (postMsgQuery.ok) openChat(currentOpenFriend.id);
    else if (postMsgQuery.status == 401) {
      // Not logged in
      return window.location.href = "/";
    }
  })
});
async function openChat(friendId) {
  const user = await getLoggedInUser();
  if (!user) return window.location.href = "/"; // Recheck if logged in - session might have expired since opening window

  try {
    const friendQuery = await fetch(`/api/users/${friendId}`);
    if (friendQuery.ok) {
      try {
        const friendData = await friendQuery.json();
        currentOpenFriend = friendData;


        const chatHeader = document.querySelector(".current-chat__header");
        chatHeader.addEventListener("click", (e) => {
          window.location.href = `/users/${friendData.id}`;
        });
        chatHeader.classList.add("current-chat__header--friend-selected");
        const chatHeaderText = document.querySelector(".current-chat__header h2");
        const chatPhoto = document.querySelector(".current-chat__photo");
        chatHeaderText.textContent = `${friendData.first_name} ${friendData.last_name}`;
        chatPhoto.src = `/api/photo/${friendData.id}`;
        chatPhoto.style.display = "block";
      } catch (ex) {
        console.error("Failed to update chat header.");
      }
    } else if (friendQuery.status == 401) {
      // Request not authorized, ask user to log in again.
      return window.location.href = "/";
    }

    const chatQuery = await fetch(`/api/chat/${friendId}`);
    if (!chatQuery.ok) {
      console.error("Failed to get chat messages.");
      if (chatQuery.status == 401) window.location.href = "/";
      return;
    }

    const messages = await chatQuery.json();

    const chatContainer = document.querySelector(".current-chat__chat-container");
    chatContainer.replaceChildren();
    messages.forEach(message => {
      const messageEl = elementBuilder("div", { class: "current-chat__message" });
      messageEl.appendChild(elementBuilder("p", { class: "current-chat__message-text", textContent: message.content }));
      if (message.sender_id == user.id) messageEl.classList.add("current-chat__message--sent");
      else messageEl.classList.add("current-chat__message--received");

      const msgDate = new Date(message.sent_at);
      const timeDisplayOptions = {
        hour12: false,
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
      }
      const timeString = msgDate.toLocaleTimeString(undefined, timeDisplayOptions);

      messageEl.appendChild(elementBuilder("p", { class: "current-chat__message-date", textContent: timeString }));
      chatContainer.appendChild(messageEl);
    });
  } catch (e) {
    console.error(e);
  }
}