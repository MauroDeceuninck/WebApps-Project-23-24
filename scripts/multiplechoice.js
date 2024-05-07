// scripts/multiplechoice.js

document.addEventListener("DOMContentLoaded", function () {
  displayMultipleChoiceQuestions();
});

function displayMultipleChoiceQuestions() {
  openDB()
    .then((db) => {
      const transaction = db.transaction(["questions", "answers"], "readonly");
      const questionStore = transaction.objectStore("questions");
      const answerStore = transaction.objectStore("answers");

      const request = questionStore.openCursor();

      const mcQuestionsContainer = document.getElementById(
        "mc-questions-container"
      );

      request.onsuccess = function (event) {
        const cursor = event.target.result;
        if (cursor) {
          console.log("Displaying multiple choice question:", cursor.value);
          const questionData = cursor.value;
          if (questionData.questionType === "mc") {
            const mcQuestionElement = createMCQuestionElement(
              questionData.question
            );
            mcQuestionsContainer.appendChild(mcQuestionElement);
            displayMCOptions(answerStore, questionData.id, mcQuestionElement);
          }
          cursor.continue();
        } else {
          console.log("All multiple choice questions displayed.");
        }
      };

      request.onerror = function (event) {
        console.error(
          "Error fetching multiple choice questions:",
          event.target.error
        );
      };
    })
    .catch((error) => {
      console.error("Error opening database:", error);
    });
}

function displayMCOptions(store, questionId, mcQuestionElement) {
  console.log("Fetching answers for question ID:", questionId);
  console.log("Store:", store);

  const getRequest = store.getAll();

  getRequest.onsuccess = function (event) {
    const answers = event.target.result.filter(
      (answer) => answer.questionId === questionId
    );
    if (answers && answers.length > 0) {
      // Shuffle the array of answers
      const shuffledAnswers = shuffleArray(answers);

      const mcOptionsContainer = mcQuestionElement.querySelector(
        ".mc-options-container"
      );
      shuffledAnswers.forEach((answer) => {
        const mcOptionElement = createMCOptionElement(answer.option);
        mcOptionsContainer.appendChild(mcOptionElement);
      });
    } else {
      console.log("No answers found for question ID:", questionId);
    }
  };

  getRequest.onerror = function (event) {
    console.error(
      "Error fetching answers for question ID:",
      questionId,
      event.target.error
    );
  };
}

function createMCQuestionElement(questionText) {
  const mcQuestionElement = document.createElement("div");
  mcQuestionElement.classList.add("mc-question");
  mcQuestionElement.innerHTML = `
      <p class="question-text">${questionText}</p>
      <div class="mc-options-container"></div>
    `;
  return mcQuestionElement;
}

function createMCOptionElement(optionText) {
  const mcOptionElement = document.createElement("div");
  mcOptionElement.classList.add("mc-option");
  mcOptionElement.textContent = optionText;
  return mcOptionElement;
}
