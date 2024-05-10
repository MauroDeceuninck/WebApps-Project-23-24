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
          answer.option + (answer.isCorrect ? " (Correct)" : "");

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
          const getRequest = answerStore.getAll();
          getRequest.onsuccess = function (event) {
            const answers = event.target.result.filter(
              (answer) => answer.questionId === questionId
            );
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

function showEditForm(question, answers) {
  console.log("QuestionType in showEditForm:", question.questionType);
  // Clear any existing content in the edit form container
  editFormContainer.innerHTML = "";

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

  // Loop through the answers and create input fields for each answer
  answers.forEach((answer, index) => {
    const answerInput = document.createElement("input");
    answerInput.type = "textbox";
    answerInput.value = answer.option;

    // Create a label for the answer input
    const answerLabel = document.createElement("label");
    answerLabel.textContent = `Answer ${index + 1}:`;
    answerLabel.appendChild(answerInput);

    // Append the answer input field to the edit form
    editForm.appendChild(answerLabel);
  });

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
        isCorrect: answer.isCorrect, // You might want to add logic here to update correctness
      })),
    };

    // Call updateQuestionAndAnswers function
    updateQuestionAndAnswers(updatedQuestion, question.questionType);
  });

  editForm.appendChild(submitBtn);

  // Append the edit form to the edit form container
  editFormContainer.appendChild(editForm);
}

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
                question.answers.forEach((answer) => {
                  answerStore.put({
                    questionId: question.id,
                    option: answer.option,
                    isCorrect: answer.isCorrect,
                  }).onsuccess = function (event) {
                    console.log("Answer added successfully");
                  };
                });

                // Close the edit form after updating
                const editFormContainer = document.getElementById(
                  "edit-form-container"
                );
                editFormContainer.innerHTML = "";

                location.reload();

                // Alternatively, refresh only the displayed questions and answers:
                // displayFlashcardQuestions();
                // displayMCQuestions();
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
