// scripts/script.js

function toggleMenu() {
  const menuIcon = document.getElementById("menu-icon");
  const menu = document.getElementById("menu");

  menuIcon.classList.toggle("active");
  menu.classList.toggle("active");
}
