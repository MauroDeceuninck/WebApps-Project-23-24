document.addEventListener("DOMContentLoaded", function () {
  loadNextQuestion();
});

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
      <div class="question-container">
        <button id="speaker-btn" class="material-icons">volume_up</button>
        <p class="question-text">${questionText}</p>
      </div>
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
                // Update button text to "Next Question"
                const nextQuestionBtn = document.querySelector(
                  ".check-answer-btn[data-question-id='" + questionId + "']"
                );
                nextQuestionBtn.textContent = "Next Question";
                // Add class to identify the button as a "Next Question" button
                nextQuestionBtn.classList.remove("check-answer-btn"); // Remove previous class
                nextQuestionBtn.classList.add("next-question-btn");
              }

              if (selectedOptionText === answer.option && !answer.isCorrect) {
                selectedOption.nextElementSibling.classList.add("incorrect");
              }

              if (selectedOptionText === answer.option) {
                alert("Correct answer!");
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
  } else if (event.target.classList.contains("next-question-btn")) {
    // Handle logic for next question button here
    console.log("Next question button clicked");
    loadNextQuestion();
  }
});

let displayedQuestionIds = []; // Keep track of displayed question IDs

function loadNextQuestion() {
  openDB()
    .then((db) => {
      const transaction = db.transaction(["questions", "answers"], "readonly");
      const questionStore = transaction.objectStore("questions");
      const answerStore = transaction.objectStore("answers");

      const request = questionStore.getAll();

      const mcQuestionsContainer = document.getElementById(
        "mc-questions-container"
      );

      request.onsuccess = function (event) {
        const questions = event.target.result;
        if (questions && questions.length > 0) {
          // Retrieve the selected category from local storage
          const selectedCategory = localStorage.getItem("selectedCategory");

          console.log("Selected category:", selectedCategory);

          // Filter out questions that have already been displayed
          const filteredQuestions = questions.filter(
            (question) =>
              !displayedQuestionIds.includes(question.id) &&
              (selectedCategory === "all" ||
                question.categoryId === selectedCategory)
          );

          // Filter out only multiple choice questions
          const mcQuestions = filteredQuestions.filter(
            (question) => question.questionType === "mc"
          );

          // If there are no more new multiple choice questions, display an alert
          if (mcQuestions.length === 0) {
            alert("All multiple choice questions have been seen.");
            return;
          }

          // Shuffle the array of multiple choice questions
          const shuffledQuestions = shuffleArray(mcQuestions);

          // Display the first multiple choice question from the shuffled list
          const questionData = shuffledQuestions[0];
          const mcQuestionElement = createMCQuestionElement(
            questionData.question,
            questionData.id
          );
          mcQuestionsContainer.innerHTML = ""; // Clear previous question
          mcQuestionsContainer.appendChild(mcQuestionElement);
          displayMCOptions(answerStore, questionData.id, mcQuestionElement);

          // Update the displayedQuestionIds array
          displayedQuestionIds.push(questionData.id);
          ttsSetup();
        } else {
          console.log("No questions found in the database.");
        }
      };

      request.onerror = function (event) {
        console.error("Error fetching questions:", event.target.error);
      };
    })
    .catch((error) => {
      console.error("Error opening database:", error);
    });
}

function ttsSetup() {
  // Get the speaker button element
  const speakerBtn = document.getElementById("speaker-btn");

  // Add event listener to the speaker button
  speakerBtn.addEventListener("click", function () {
    // Get the question text
    const questionText = document.querySelector(".question-text").textContent;

    // Get the options text
    const optionsContainer = document.querySelector(".mc-options-container");
    const options = Array.from(optionsContainer.querySelectorAll("span")).map(
      (option) => option.textContent
    );
    const optionsText = options.join(", ");

    // Concatenate the question and options text
    const textContent = `${questionText}. ${optionsText}`;

    // Create a new SpeechSynthesisUtterance object with the concatenated text content
    const speech = new SpeechSynthesisUtterance(textContent);

    speech.lang = speechSynthesis.lang;

    // Speak the text
    speechSynthesis.speak(speech);
  });
}
