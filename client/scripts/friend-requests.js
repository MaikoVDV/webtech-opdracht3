import { elementBuilder, routePatcher } from "./utils.js";

/*
Fills the sent friend requests box and received friend requests box with the appropriate data, fetched from the server.
Also adds buttons to them with handlers for accepting/rejecting friend requests.
*/

window.addEventListener("load", async () => {
  updateFriendRequestList();
});

// Updates the friend requests list as specified at top of file.
async function updateFriendRequestList() {
  const requestsQuery = await fetch(routePatcher("api/friend-requests"), {
    method: "GET",
  });
  const requests = await requestsQuery.json();
  try {
    const receivedReqsContainer = document.querySelector("#received-friend-requests-container");
    receivedReqsContainer.replaceChildren();
    // Sorts received requests with pending requests at the top.
    requests.received.sort((a, b) => {
      let out = 0;
      if (a.status == "pending") out--;
      if (b.status == "pending") out++;
      return out;
    });

    requests.received.forEach(receivedRequest => {
      const requestItem = elementBuilder("li", { class: "friend-req-list__item" });
      const profileDisplay = elementBuilder("div");
      profileDisplay.appendChild(elementBuilder("img", { src: routePatcher(`api/photo/${receivedRequest.id}`) }));
      profileDisplay.appendChild(elementBuilder("p", { class: "friend-req-list__student-name", textContent: `${receivedRequest.first_name} ${receivedRequest.last_name}` }));
      requestItem.appendChild(profileDisplay);

      if (receivedRequest.status == "pending") {
        const controlsDisplay = elementBuilder("div");
        const acceptBtn = elementBuilder("button", { class: "friend-req-list__accept-btn" });
        acceptBtn.appendChild(elementBuilder("p", { textContent: "Accept"}));
        acceptBtn.addEventListener("click", async () => {
          await fetch(routePatcher(`api/friend-requests/${receivedRequest.id}/respond`), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "accept"
            })
          });
          updateFriendRequestList();
        });

        const rejectBtn = elementBuilder("button", { class: "friend-req-list__reject-btn" });
        rejectBtn.appendChild(elementBuilder("p", { textContent: "Reject"}));
        rejectBtn.addEventListener("click", async () => {
          await fetch(routePatcher(`api/friend-requests/${receivedRequest.id}/respond`), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "reject"
            })
          });
          updateFriendRequestList();
        });

        controlsDisplay.appendChild(rejectBtn);
        controlsDisplay.appendChild(acceptBtn);
        requestItem.appendChild(controlsDisplay);
      } else {
        requestItem.appendChild(elementBuilder("p", { textContent: receivedRequest.status}));
      }

      receivedReqsContainer.appendChild(requestItem);
    });

    const sentReqsContainer = document.querySelector("#sent-friend-requests-container");
    sentReqsContainer.replaceChildren();

    // Sorts received requests with pending requests at the top.
    requests.sent.sort((a, b) => {
      let out = 0;
      if (a.status == "pending") out--;
      if (b.status == "pending") out++;
      return out;
    });

    requests.sent.forEach(sentRequest => {
      const requestItem = elementBuilder("li", { class: "friend-req-list__item" });
      const profileDisplay = elementBuilder("div");
      profileDisplay.appendChild(elementBuilder("img", { src: routePatcher(`api/photo/${sentRequest.target_id}`) }));
      profileDisplay.appendChild(elementBuilder("p", { class: "friend-req-list__student-name", textContent: `${sentRequest.first_name} ${sentRequest.last_name}` }));
      requestItem.appendChild(profileDisplay);

      requestItem.appendChild(elementBuilder("p", { textContent: sentRequest.status}));

      sentReqsContainer.appendChild(requestItem);
    });
  } catch (e) {
    console.error(e);
    if (requestsQuery.status == 401) {
      return window.location.href = routePatcher("");
    }
  }
}