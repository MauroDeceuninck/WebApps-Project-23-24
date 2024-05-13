// scripts/script.js

// Load and inject the navbar content
window.addEventListener("DOMContentLoaded", function () {
  // Load and inject the navbar content
  if (document.getElementById("navbar-container")) {
    fetch("navbar.html")
      .then((response) => response.text())
      .then((data) => {
        document.getElementById("navbar-container").innerHTML = data;
        // Once navbar content is loaded, access the languageSelect element
        const languageSelect = document.getElementById("languageSelect");
        if (languageSelect) {
          // Get the selected language from localStorage
          const selectedLanguage = localStorage.getItem("selectedLanguage");

          // Set the selected language in the dropdown
          if (selectedLanguage) {
            speechSynthesis.lang = selectedLanguage;
            languageSelect.value = selectedLanguage;
          }

          // Add event listener to the language select element
          languageSelect.addEventListener("change", function () {
            // Get the selected language value
            const selectedLanguage = this.value;

            // Log the selected language value to the console for debugging
            console.log("Selected language:", selectedLanguage);

            // Set the language for speech synthesis
            speechSynthesis.lang = selectedLanguage;

            // Save the selected language to localStorage
            localStorage.setItem("selectedLanguage", selectedLanguage);

            // Check if the selected language is supported
            checkLanguageSupport(selectedLanguage);
          });

          // Trigger the change event to initialize speech synthesis language
          languageSelect.dispatchEvent(new Event("change"));
        }
      });
  }
});

function checkLanguageSupport(selectedLanguage) {
  const voices = speechSynthesis.getVoices();
  if (voices.length === 0) {
    speechSynthesis.onvoiceschanged = function () {
      checkLanguageSupport(selectedLanguage);
    };
  } else {
    if (!voices.some((voice) => voice.lang === selectedLanguage)) {
      alert(
        "The selected language is not supported by the browser. Falling back to English."
      );
      speechSynthesis.lang = "en-US";
      languageSelect.value = "en-US";

      // Save the fallback language to localStorage
      localStorage.setItem("selectedLanguage", "en-US");
    }
  }
}

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

function getCategories() {
  return new Promise((resolve, reject) => {
    openDB()
      .then((db) => {
        const transaction = db.transaction("categories", "readonly");
        const categoryStore = transaction.objectStore("categories");
        const request = categoryStore.getAll();

        request.onsuccess = (event) => {
          const categories = event.target.result;
          resolve(categories);
        };

        request.onerror = (event) => {
          reject(event.target.error);
        };
      })
      .catch((error) => {
        reject(error);
      });
  });
}

window.addEventListener("DOMContentLoaded", function () {
  document.addEventListener("input", function (event) {
    if (event.target.matches('input[type="textbox"]')) {
      event.target.style.width = (event.target.value.length + 1) * 7 + "px";
    }
  });
});
