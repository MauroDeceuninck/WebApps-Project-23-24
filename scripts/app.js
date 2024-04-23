// scripts/app.js
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("question-form");
  const questionInput = document.getElementById("question-input");
  const answerInput = document.getElementById("answer-input");

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    const question = questionInput.value.trim();
    const answer = answerInput.value.trim();

    if (question && answer) {
      saveQuestion(question, answer);
      questionInput.value = "";
      answerInput.value = "";
    } else {
      alert("Please enter both a question and an answer.");
    }
  });

  // Check if browser supports service workers
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("service-worker.js").then(
        function (registration) {
          console.log(
            "ServiceWorker registration successful with scope: ",
            registration.scope
          );
        },
        function (err) {
          console.log("ServiceWorker registration failed: ", err);
        }
      );
    });
  } else {
    alert("No service worker support in this browser.");
  }
});

function saveQuestion(question, answer) {
  const dbPromise = openDB();
  dbPromise
    .then((db) => {
      const tx = db.transaction("questions", "readwrite");
      const store = tx.objectStore("questions");
      store.add({ question, answer });
      return tx.complete;
    })
    .then(() => {
      console.log("Question added to IndexedDB.");
    })
    .catch((error) => {
      console.error("Error adding question to IndexedDB:", error);
    });
}

function openDB() {
  return idb.openDB("studieassist-db", 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("questions")) {
        db.createObjectStore("questions", {
          keyPath: "id",
          autoIncrement: true,
        });
      }
    },
  });
}
