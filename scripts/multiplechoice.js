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
              questionData.question,
              questionData.id
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
      shuffledAnswers.forEach((answer, index) => {
        const mcOptionElement = createMCOptionElement(answer.option, index + 1);
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

function createMCQuestionElement(questionText, questionId) {
  const mcQuestionElement = document.createElement("div");
  mcQuestionElement.classList.add("mc-question");
  mcQuestionElement.innerHTML = `
      <p class="question-text">${questionText}</p>
      <div class="mc-options-container"></div>
      <button class="check-answer-btn" data-question-id="${questionId}">Check Answer</button>
    `;
  return mcQuestionElement;
}

function createMCOptionElement(optionText, optionId) {
  const mcOptionElement = document.createElement("div");
  mcOptionElement.classList.add("move");

  const inputElement = document.createElement("input");
  inputElement.type = "radio";
  inputElement.name = "r";
  inputElement.id = "pointer" + optionId;

  const labelElement = document.createElement("label");
  labelElement.htmlFor = "pointer" + optionId;

  const divElement = document.createElement("div");
  divElement.setAttribute("data-type", "pointer");

  const spanElement = document.createElement("span");
  spanElement.textContent = optionText;

  labelElement.appendChild(divElement);
  labelElement.appendChild(spanElement);

  mcOptionElement.appendChild(inputElement);
  mcOptionElement.appendChild(labelElement);

  return mcOptionElement;
}

document.addEventListener("click", function (event) {
  if (event.target.classList.contains("check-answer-btn")) {
    const questionId = parseInt(event.target.getAttribute("data-question-id"));
    const selectedOption = document.querySelector(`input[name="r"]:checked`);
    if (!selectedOption) {
      alert("Please select an option before checking the answer.");
      return;
    }
    const selectedOptionText =
      selectedOption.nextElementSibling.textContent.trim();

    openDB()
      .then((db) => {
        const transaction = db.transaction(["answers"], "readonly");
        const answerStore = transaction.objectStore("answers");

        console.log("Checking answer for question ID:", questionId);
        const getRequest = answerStore.openCursor();

        getRequest.onsuccess = function (event) {
          const cursor = event.target.result;
          if (cursor) {
            const answer = cursor.value;
            console.log("All answers:", cursor.value);
            if (answer.questionId === questionId) {
              console.log("Answer for question ID:", questionId, answer);
              console.log("Selected option:", selectedOptionText);
              console.log("Correct option:", answer.option);

              // Highlight wrong answer in red
              if (selectedOptionText !== answer.option) {
                selectedOption.nextElementSibling.classList.add("incorrect");
              }
              // Highlight correct answer in green
              if (selectedOptionText === answer.option && answer.isCorrect) {
                selectedOption.nextElementSibling.classList.add("correct");
              }

              if (selectedOptionText === answer.option && !answer.isCorrect) {
                selectedOption.nextElementSibling.classList.add("incorrect");
              }

              if (selectedOptionText === answer.option) {
                alert("Correct answer!");
                event.target.textContent = "Next";
                // You can implement logic to proceed to the next question here
              } else {
                alert("Incorrect answer. Please try again.");
                // You can implement additional logic for incorrect answers here
              }
              return; // Stop iterating over cursor once answer is found
            }
            cursor.continue();
          } else {
            // No answer found
            console.log("No answer found for question ID:", questionId);
            alert("No answer found for this question.");
          }
        };

        getRequest.onerror = function (event) {
          console.error(
            "Error fetching answer for question ID:",
            questionId,
            event.target.error
          );
        };
      })
      .catch((error) => {
        console.error("Error opening database:", error);
      });
  }
});
