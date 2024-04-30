// scripts/script.js

// Load and inject the navbar content
window.addEventListener("DOMContentLoaded", function () {
  if (document.getElementById("navbar-container")) {
    fetch("navbar.html")
      .then((response) => response.text())
      .then((data) => {
        document.getElementById("navbar-container").innerHTML = data;
      });
  }
});

function toggleMenu() {
  const menuIcon = document.getElementById("menu-icon");
  const menu = document.getElementById("menu");

  menuIcon.classList.toggle("active");
  menu.classList.toggle("active");
}
