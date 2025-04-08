import { elementBuilder } from "./utils.js";
window.addEventListener("load", async () => {
  const requestsQuery = await fetch("/api/friend-requests", {
    method: "GET",
  });
  const requests = await requestsQuery.json();
  try {
    console.log(requests);

    const receivedReqsContainer = document.querySelector("#received-friend-requests-container");
    requests.received.forEach(receivedRequest => {

      const requestItem = elementBuilder("li", { class: "friend-req-list__item" });
      const profileDisplay = elementBuilder("div");
      profileDisplay.appendChild(elementBuilder("img", { src: `/api/photo/${receivedRequest.id}` }));
      profileDisplay.appendChild(elementBuilder("p", { class: "friend-req-list__student-name", textContent: `${receivedRequest.first_name} ${receivedRequest.last_name}` }));
      requestItem.appendChild(profileDisplay);

      const controlsDisplay = elementBuilder("div");
      const acceptBtn = elementBuilder("button", { class: "friend-req-list__accept-btn" });
      acceptBtn.appendChild(elementBuilder("p", { textContent: "Accept"}));
      const rejectBtn = elementBuilder("button", { class: "friend-req-list__reject-btn" });
      rejectBtn.appendChild(elementBuilder("p", { textContent: "Reject"}));
      controlsDisplay.appendChild(rejectBtn);
      controlsDisplay.appendChild(acceptBtn);
      requestItem.appendChild(controlsDisplay);

      receivedReqsContainer.appendChild(requestItem);
    });

    const sentReqsContainer = document.querySelector("#sent-friend-requests-container");
  } catch (e) {
    console.log(e);
    if (requestsQuery.status == 401) {
      return window.location.href = "/";
    }
  }
});