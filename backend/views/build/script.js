// script.js
// Function to get URL parameters
function getUrlParameter(name) {
  name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
  var regex = new RegExp("[\\?&]" + name + "=([^&#]*)");
  var results = regex.exec(location.search);
  return results === null
    ? ""
    : decodeURIComponent(results[1].replace(/\+/g, " "));
}

// Function to handle displaying messages
function displayMessage() {
  const messageParam = getUrlParameter("message");
  const statusParam = getUrlParameter("status");

  const statusIcon = document.getElementById("statusIcon");
  const statusMessage = document.getElementById("statusMessage");

  if (statusParam === "success") {
    statusIcon.innerHTML = "✔️";
    statusMessage.innerHTML = messageParam;
    statusMessage.classList.add("success");
  } else if (statusParam === "error") {
    statusIcon.innerHTML = "❌";
    statusMessage.innerHTML = messageParam;
    statusMessage.classList.add("error");
  } else {
    statusIcon.innerHTML = "❓";
    statusMessage.innerHTML = "Something went wrong. Please try again.";
    statusMessage.classList.add("error");
  }
}

// Call the function when the page loads
window.onload = function () {
  displayMessage();
};
