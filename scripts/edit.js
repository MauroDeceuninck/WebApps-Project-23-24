// scripts/edit.js
document.addEventListener("DOMContentLoaded", function () {
  displayFlashcardQuestions();
  displayMCQuestions();
});

function displayFlashcardQuestions() {
  const flashcardQuestionsContainer = document.getElementById(
    "flashcard-questions"
  );
  openDB()
    .then((db) => {
      const transaction = db.transaction(["questions", "answers"], "readwrite");
      const questionStore = transaction.objectStore("questions");
      const answerStore = transaction.objectStore("answers");
      const getRequest = questionStore.getAll();

      getRequest.onsuccess = function (event) {
        const questions = event.target.result.filter(
          (question) => question.questionType === "fc"
        );
        if (questions && questions.length > 0) {
          questions.forEach((question) => {
            const questionElement = document.createElement("div");
            questionElement.classList.add("question-container");
            questionElement.textContent = question.question;
            // Display answers
            displayAnswers(answerStore, question, questionElement);

            flashcardQuestionsContainer.appendChild(questionElement);
          });
        } else {
          flashcardQuestionsContainer.textContent =
            "No flashcard questions found.";
        }
      };

      getRequest.onerror = function (event) {
        console.error(
          "Error fetching flashcard questions:",
          event.target.error
        );
      };
    })
    .catch((error) => {
      console.error("Error opening database:", error);
    });
}

function displayMCQuestions() {
  const mcQuestionsContainer = document.getElementById("mc-questions");
  openDB()
    .then((db) => {
      const transaction = db.transaction(["questions", "answers"], "readwrite");
      const questionStore = transaction.objectStore("questions");
      const answerStore = transaction.objectStore("answers");
      const getRequest = questionStore.getAll();

      getRequest.onsuccess = function (event) {
        const questions = event.target.result.filter(
          (question) => question.questionType === "mc"
        );
        if (questions && questions.length > 0) {
          questions.forEach((question) => {
            const questionElement = document.createElement("div");
            questionElement.classList.add("question-container");
            questionElement.textContent = question.question;

            // Display answers
            displayAnswers(answerStore, question, questionElement);

            mcQuestionsContainer.appendChild(questionElement);
          });
        } else {
          mcQuestionsContainer.textContent =
            "No multiple choice questions found.";
        }
      };

      getRequest.onerror = function (event) {
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

function displayAnswers(answerStore, question, questionElement) {
  const getRequest = answerStore.index("questionId").getAll(question.id);

  getRequest.onsuccess = async function (event) {
    const answers = event.target.result;
    if (answers && answers.length > 0) {
      const answersList = document.createElement("ul");
      answers.forEach((answer) => {
        const answerItem = document.createElement("li");
        answerItem.textContent =
          question.questionType === "mc"
            ? answer.option + (answer.isCorrect ? " (Correct)" : "")
            : answer.option;

        // Append answer item to the answers list
        answersList.appendChild(answerItem);
      });

      // Create edit and delete buttons for the question
      const editButton = document.createElement("button");
      editButton.textContent = "Edit";
      editButton.addEventListener("click", function () {
        editQuestion(question.id);
      });

      const deleteButton = document.createElement("button");
      deleteButton.textContent = "Delete";
      deleteButton.addEventListener("click", function () {
        deleteQuestion(question.id);
      });

      // Create category dropdown menu
      const categoryDropdown = document.createElement("select");
      const categories = await getCategories(); // Get all available categories
      categories.forEach((category) => {
        const option = document.createElement("option");
        option.value = category.id;
        option.textContent = category.name;
        // Set the selected category based on the question's current category
        if (category.id == question.categoryId) {
          option.selected = true;
        }
        categoryDropdown.appendChild(option);
      });

      // Add event listener to category dropdown
      categoryDropdown.addEventListener("change", function (event) {
        const newCategoryId = event.target.value;
        updateQuestionCategory(question.id, newCategoryId);
      });

      // Append edit, delete buttons, and category dropdown to the question element
      questionElement.appendChild(answersList);
      questionElement.appendChild(categoryDropdown);
      questionElement.appendChild(editButton);
      questionElement.appendChild(deleteButton);
    }
  };

  getRequest.onerror = function (event) {
    console.error("Error fetching answers for question:", event.target.error);
  };
}

function updateQuestionCategory(questionId, newCategoryId) {
  openDB()
    .then((db) => {
      const transaction = db.transaction("questions", "readwrite");
      const questionStore = transaction.objectStore("questions");

      const getQuestionRequest = questionStore.get(questionId);

      getQuestionRequest.onsuccess = function (event) {
        const question = event.target.result;
        if (question) {
          // Update the category of the question
          question.categoryId = newCategoryId;
          const updateRequest = questionStore.put(question);

          updateRequest.onsuccess = function (event) {
            console.log("Question category updated successfully");
          };

          updateRequest.onerror = function (event) {
            console.error(
              "Error updating question category:",
              event.target.error
            );
          };
        } else {
          console.error("Question not found");
        }
      };

      getQuestionRequest.onerror = function (event) {
        console.error("Error fetching question:", event.target.error);
      };
    })
    .catch((error) => {
      console.error("Error opening database:", error);
    });
}

function deleteQuestion(questionId, questionType) {
  openDB()
    .then((db) => {
      const transaction = db.transaction(["questions", "answers"], "readwrite");
      const questionStore = transaction.objectStore("questions");
      const answerStore = transaction.objectStore("answers");

      const deleteQuestionRequest = questionStore.delete(questionId);

      deleteQuestionRequest.onsuccess = function (event) {
        console.log("Question deleted successfully");
        // Delete corresponding answers
        const deleteAnswersRequest = answerStore
          .index("questionId")
          .openCursor(IDBKeyRange.only(questionId));
        deleteAnswersRequest.onsuccess = function (event) {
          const cursor = event.target.result;
          if (cursor) {
            cursor.delete();
            cursor.continue();
          }
        };
        deleteAnswersRequest.onerror = function (event) {
          console.error(
            "Error deleting answers for question:",
            event.target.error
          );
        };
        // // Refresh the displayed questions and answers
        // displayFlashcardQuestions();
        // displayMCQuestions();

        location.reload();
      };

      deleteQuestionRequest.onerror = function (event) {
        console.error("Error deleting question:", event.target.error);
      };
    })
    .catch((error) => {
      console.error("Error opening database:", error);
    });
}

function editQuestion(questionId) {
  openDB()
    .then((db) => {
      const transaction = db.transaction(["questions", "answers"], "readonly");
      const questionStore = transaction.objectStore("questions");
      const answerStore = transaction.objectStore("answers");

      console.log("Editing question with ID:", questionId);
      const getQuestionRequest = questionStore.get(questionId);

      getQuestionRequest.onsuccess = function (event) {
        const question = event.target.result;
        console.log("Retrieved question:", question);
        if (question) {
          // Fetch answers associated with the question
          const getRequest = answerStore.index("questionId").getAll(questionId);
          getRequest.onsuccess = function (event) {
            const answers = event.target.result;
            // Pass both the question and its answers to the edit form
            showEditForm(question, answers);
          };
          getRequest.onerror = function (event) {
            console.error("Error fetching answers:", event.target.error);
          };
        } else {
          console.error("Question not found");
        }
      };

      getQuestionRequest.onerror = function (event) {
        console.error("Error fetching question:", event.target.error);
      };
    })
    .catch((error) => {
      console.error("Error opening database:", error);
    });
}

// Define the editFormContainer variable and assign it the appropriate container element
const editFormContainer = document.getElementById("edit-form-container");

// Array to store entered answer values
let answerValues = [];

function hasDuplicates(array) {
  return new Set(array).size !== array.length;
}

function showEditForm(question, answers) {
  console.log("Question:", question);
  console.log("Answers:", answers);

  // Clear any existing content in the edit form container
  editFormContainer.innerHTML = "";

  if (!question || !answers) {
    console.error("Error: Question or answers not found.");
    return;
  }

  // Create form elements for editing the question
  const editForm = document.createElement("form");
  const questionInput = document.createElement("input");
  questionInput.type = "textbox";
  questionInput.value = question.question;

  // Append the question input field to the edit form
  const questionLabel = document.createElement("label");
  questionLabel.textContent = "Question:";
  questionLabel.appendChild(questionInput);
  editForm.appendChild(questionLabel);

  // Initialize to false so that the button starts off enabled
  let hasDuplicate = false;

  // Create the submit button
  const submitBtn = document.createElement("button");
  submitBtn.textContent = "Submit";
  submitBtn.addEventListener("click", function (event) {
    event.preventDefault(); // Prevent default form submission

    // Collect the updated question and answers from the input fields
    const updatedQuestion = {
      id: question.id,
      question: questionInput.value,
      // Collect answers from input fields
      answers: answers.map((answer, index) => ({
        option: editForm.querySelectorAll("input[type='textbox']")[index + 1]
          .value,
        isCorrect: answer.isCorrect,
      })),
    };

    // Call updateQuestionAndAnswers function
    updateQuestionAndAnswers(updatedQuestion, question.questionType);
  });

  answers.forEach((answer, index) => {
    // Create input field for the answer
    const answerInput = document.createElement("input");
    answerInput.type = "textbox";
    answerInput.value = answer.option;
    const answerContainer = document.createElement("div");

    // Create a label for the answer input
    const answerLabel = document.createElement("label");
    answerLabel.textContent = `Answer ${index + 1}:`;
    answerLabel.appendChild(answerInput);

    // Append the answer input field to the answer container
    answerContainer.appendChild(answerLabel);

    // Add radio button for selecting correct answer
    const isCorrectRadio = document.createElement("input");
    isCorrectRadio.type = "radio";
    isCorrectRadio.name = `correctAnswer_${question.id}`;
    isCorrectRadio.value = index;
    isCorrectRadio.checked = answer.isCorrect;
    isCorrectRadio.addEventListener("change", function () {
      // Update isCorrect property of the answer
      answers.forEach((ans, idx) => {
        ans.isCorrect = idx === parseInt(isCorrectRadio.value);
      });
    });

    const isCorrectLabel = document.createElement("label");
    isCorrectLabel.textContent = "Correct answer";
    isCorrectLabel.appendChild(isCorrectRadio);

    answerContainer.appendChild(isCorrectLabel);

    // Add event listener to check for empty or duplicate input values
    answerInput.addEventListener("input", function () {
      console.log("Input value changed");
      // Check if any input value is empty
      const anyEmpty = [
        ...editForm.querySelectorAll('input[type="textbox"]'),
      ].some((input) => input.value.trim() === "");
      // Check for duplicate input values
      const anyDuplicate = [
        ...editForm.querySelectorAll('input[type="textbox"]'),
      ].some((input, index) => {
        const currentValue = input.value.trim();
        return (
          currentValue !== "" &&
          [...editForm.querySelectorAll('input[type="textbox"]')].some(
            (otherInput, otherIndex) =>
              index !== otherIndex && otherInput.value.trim() === currentValue
          )
        );
      });
      console.log("Any empty:", anyEmpty);
      console.log("Any duplicate:", anyDuplicate);
      // Enable or disable the submit button based on whether there are empty or duplicate values
      submitBtn.disabled = anyEmpty || anyDuplicate;
    });

    // Append the answer container to the edit form
    editForm.appendChild(answerContainer);
  });

  // Create the cancel button
  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = "Cancel";
  cancelBtn.addEventListener("click", function (event) {
    event.preventDefault(); // Prevent default form submission
    // Clear the edit form container
    editFormContainer.innerHTML = "";
  });

  const buttonsContainer = document.createElement("div");
  buttonsContainer.classList.add("buttons-container");
  buttonsContainer.appendChild(submitBtn);
  buttonsContainer.appendChild(cancelBtn);

  editForm.appendChild(buttonsContainer);

  // Append the edit form to the edit form container
  editFormContainer.appendChild(editForm);
}

// Load answer values from localStorage when the page loads
document.addEventListener("DOMContentLoaded", function () {
  answerValues = JSON.parse(localStorage.getItem("answerValues")) || [];
});

function updateQuestionAndAnswers(question, questionType) {
  openDB()
    .then((db) => {
      const transaction = db.transaction(["questions", "answers"], "readwrite");
      const questionStore = transaction.objectStore("questions");
      const answerStore = transaction.objectStore("answers");

      // Fetch the existing question object
      const getQuestionRequest = questionStore.get(question.id);

      getQuestionRequest.onsuccess = function (event) {
        const existingQuestion = event.target.result;
        if (existingQuestion) {
          // Update only the question and questionType fields
          existingQuestion.question = question.question;
          existingQuestion.questionType = questionType;

          // Check if the question field is filled in
          if (existingQuestion.question.trim() === "") {
            alert("Please fill in the question.");
            return;
          }

          // Check if all answer options are filled and a correct answer is selected
          const allAnswersFilled = question.answers.every(
            (answer) =>
              answer.option.trim() !== "" && answer.isCorrect !== undefined
          );

          if (!allAnswersFilled) {
            alert(
              "Please fill in all answer options and select a correct answer."
            );
            return;
          }

          // Update the question in the questions store
          const updateQuestionRequest = questionStore.put(existingQuestion);

          updateQuestionRequest.onsuccess = function (event) {
            console.log("Question updated successfully");

            // Delete existing answers for the question
            const deleteAnswersRequest = answerStore
              .index("questionId")
              .openCursor(IDBKeyRange.only(question.id));
            deleteAnswersRequest.onsuccess = function (event) {
              const cursor = event.target.result;
              if (cursor) {
                cursor.delete();
                cursor.continue();
              } else {
                // Once all existing answers are deleted, add or update the new answers
                const addAnswerPromises = question.answers.map((answer) => {
                  return new Promise((resolve, reject) => {
                    answerStore.put({
                      questionId: question.id,
                      option: answer.option,
                      isCorrect: answer.isCorrect,
                    }).onsuccess = function (event) {
                      console.log("Answer added successfully");
                      resolve();
                    };
                  });
                });

                // Wait for all answers to be added or updated
                Promise.all(addAnswerPromises)
                  .then(() => {
                    console.log("All answers added successfully");
                    // Close the edit form after updating
                    const editFormContainer = document.getElementById(
                      "edit-form-container"
                    );
                    editFormContainer.innerHTML = "";

                    // // Refresh the displayed questions and answers
                    // displayFlashcardQuestions();
                    // displayMCQuestions();

                    window.location.reload();
                  })
                  .catch((error) => {
                    console.error("Error adding answers:", error);
                  });
              }
            };
            deleteAnswersRequest.onerror = function (event) {
              console.error(
                "Error deleting answers for question:",
                event.target.error
              );
            };
          };

          updateQuestionRequest.onerror = function (event) {
            console.error("Error updating question:", event.target.error);
          };
        } else {
          console.error("Question not found");
        }
      };

      getQuestionRequest.onerror = function (event) {
        console.error("Error fetching question:", event.target.error);
      };
    })
    .catch((error) => {
      console.error("Error opening database:", error);
    });
}
