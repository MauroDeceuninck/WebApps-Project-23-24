// scripts/add.js

function saveQuestion(
  question,
  questionType,
  correctAnswer,
  otherAnswers,
  categoryId
) {
  openDB()
    .then((db) => {
      const transaction = db.transaction(["questions", "answers"], "readwrite");
      const questionStore = transaction.objectStore("questions");
      const answerStore = transaction.objectStore("answers");

      // Add the question to the questions table
      const questionData = {
        question: question,
        questionType: questionType,
        categoryId: categoryId, // Include category ID
      };
      console.log("Question Data:", questionData);
      const questionRequest = questionStore.add(questionData);

      questionRequest.onsuccess = (event) => {
        const questionId = event.target.result;

        // If it's a multiple choice question, add correct answer to the answers table
        // and then add other answers
        if (questionType === "mc") {
          // Add the correct answer to the answers table
          answerStore.add({
            questionId: questionId,
            option: correctAnswer,
            isCorrect: true,
          });

          // Filter out the correct answer from otherAnswers
          const filteredOtherAnswers = otherAnswers.filter(
            (option) => option !== correctAnswer
          );

          // Add other answers to the answers table
          filteredOtherAnswers.forEach((option) => {
            answerStore.add({
              questionId: questionId,
              option: option,
              isCorrect: false,
            });
          });
        } else if (questionType === "fc") {
          // For flashcard questions, add the answer directly to the answers table
          answerStore.add({
            questionId: questionId,
            option: correctAnswer,
            isCorrect: true,
          });
        }
      };

      transaction.oncomplete = () => {
        console.log("Question and answers added to IndexedDB.");
      };
    })
    .catch((error) => {
      console.error("Error opening database:", error);
    });
}

// scripts/add.js
document.addEventListener("DOMContentLoaded", function () {
  const questionTypeSelect = document.getElementById("question-type");
  const flashcardQuestionFields = document.getElementById(
    "flashcard-question-fields"
  );
  const mcQuestionFields = document.getElementById("mc-question-fields");
  const addButton = document.querySelector("#addPage button[type='submit']");

  // Function to toggle visibility of question fields based on selected question type
  function toggleQuestionFields() {
    flashcardQuestionFields.style.display = "none";
    mcQuestionFields.style.display = "none";

    const selectedOption = questionTypeSelect.value;

    if (selectedOption === "flashcard") {
      flashcardQuestionFields.style.display = "block";
      addButton.style.display = "block"; // Show the button for flashcard questions
    } else if (selectedOption === "multiple-choice") {
      mcQuestionFields.style.display = "block";
      addButton.style.display = "block"; // Show the button for multiple choice questions
    } else {
      addButton.style.display = "none"; // Hide the button if no option is selected
    }
  }

  // Event listener for changes in the dropdown menu
  questionTypeSelect.addEventListener("change", toggleQuestionFields);

  // Call toggleQuestionFields initially to set the initial state
  toggleQuestionFields();

  // Inside the form submit event listener
  const form = document.querySelector("form");
  form.addEventListener("submit", async function (event) {
    event.preventDefault(); // Prevent the default form submission

    const selectedCategoryId = document.getElementById("category-select").value;

    // Get the question data based on the selected question type
    let question, correctAnswer, questionType;
    const selectedOption = questionTypeSelect.value;
    if (selectedOption === "flashcard") {
      question = document.getElementById("flashcard-question").value;
      correctAnswer = document.getElementById("flashcard-answer").value;
      questionType = "fc"; // Specify the question type

      // Save the question along with the correct answer to IndexedDB
      saveQuestion(
        question,
        questionType,
        correctAnswer,
        [],
        selectedCategoryId
      );
    } else if (selectedOption === "multiple-choice") {
      question = document.getElementById("mc-question").value;
      questionType = "mc"; // Specify the question type
      const options = [];
      const numOptions = 4; // Change this value to set the number of options

      for (let i = 1; i <= numOptions; i++) {
        const optionInput = document.getElementById(`mc-option-${i}`);
        const radio = document.querySelector(
          `input[name="correct-answer"][value="${i}"]`
        );

        console.log("Option Input:", optionInput);
        console.log("Radio Button:", radio);

        options.push(optionInput.value);
        if (radio.checked) {
          correctAnswer = optionInput.value;
        }
      }

      // Save the question along with all options to IndexedDB
      saveQuestion(
        question,
        questionType,
        correctAnswer,
        options,
        selectedCategoryId
      );
    }

    console.log("Question:", question);
    console.log("Correct Answer:", correctAnswer);
    console.log("Category ID:", selectedCategoryId);
    console.log("Question Type:", questionType); // Log the question type
    // Clear the form fields
    form.reset();
  });
});

document.addEventListener("DOMContentLoaded", async function () {
  // Fetch categories
  const categories = await getCategories();
  const categorySelect = document.getElementById("category-select");

  // Populate dropdown list with categories
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category.id;
    option.textContent = category.name;
    categorySelect.appendChild(option);
  });

  // Other code remains the same...
});
