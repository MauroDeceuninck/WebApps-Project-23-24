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

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
