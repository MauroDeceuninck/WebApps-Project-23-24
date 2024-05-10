// scripts/app.js
document.addEventListener("DOMContentLoaded", function () {
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

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("studieassist-db", 3);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Create object store for questions
      const questionStore = db.createObjectStore("questions", {
        keyPath: "id",
        autoIncrement: true,
      });

      // Create object store for answers
      const answerStore = db.createObjectStore("answers", {
        keyPath: "id",
        autoIncrement: true,
      });

      // Create object store for categories
      const categoryStore = db.createObjectStore("categories", {
        keyPath: "id",
        autoIncrement: true,
      });

      // Create an index in the "answers" object store for querying by questionId
      answerStore.createIndex("questionId", "questionId", { unique: false });
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      resolve(db);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}
