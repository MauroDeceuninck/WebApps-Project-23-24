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
      db.createObjectStore("questions", { keyPath: "id", autoIncrement: true });
      db.createObjectStore("answers", { keyPath: "id", autoIncrement: true });
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

// function saveQuestion(question, answer) {
//   const dbPromise = openDB();
//   dbPromise
//     .then((db) => {
//       const tx = db.transaction("questions", "readwrite");
//       const store = tx.objectStore("questions");
//       store.add({ question, answer });
//       return tx.complete;
//     })
//     .then(() => {
//       console.log("Question added to IndexedDB.");
//     })
//     .catch((error) => {
//       console.error("Error adding question to IndexedDB:", error);
//     });
// }
