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

document.addEventListener("DOMContentLoaded", function () {
  const questionTypeSelect = document.getElementById("question-type");
  const flashcardQuestionFields = document.getElementById(
    "flashcard-question-fields"
  );
  const mcQuestionFields = document.getElementById("mc-question-fields");
  const addButton = document.querySelector("#addPage button[type='submit']");
  const categorySelect = document.getElementById("category-select");
  const categoryLabel = document.querySelector("label[for='category-select']");

  // Function to toggle visibility of question fields and category select based on selected question type
  function toggleQuestionFields() {
    flashcardQuestionFields.style.display = "none";
    mcQuestionFields.style.display = "none";
    addButton.style.display = "none"; // Hide the button by default
    categorySelect.style.display = "none"; // Hide category select by default
    categoryLabel.style.display = "none"; // Hide category label by default

    const selectedOption = questionTypeSelect.value;

    if (selectedOption === "flashcard") {
      flashcardQuestionFields.style.display = "block";
    } else if (selectedOption === "multiple-choice") {
      mcQuestionFields.style.display = "block";
    }

    if (
      selectedOption === "flashcard" ||
      selectedOption === "multiple-choice"
    ) {
      addButton.style.display = "block"; // Show the button for multiple choice questions
      categorySelect.style.display = "block"; // Show category select for flashcard questions
      categoryLabel.style.display = "block"; // Show category label for flashcard questions
    }
  }

  // Add event listener to question type select to trigger toggleQuestionFields() function
  questionTypeSelect.addEventListener("change", toggleQuestionFields);

  // Trigger toggleQuestionFields() function on page load
  toggleQuestionFields();

  // Inside the form submit event listener
  const form = document.querySelector("form");
  form.addEventListener("submit", async function (event) {
    event.preventDefault(); // Prevent the default form submission

    const selectedCategoryId = document.getElementById("category-select").value;

    // Inside the form submit event listener
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
      const numOptions = 4; // Number of options
      let selectedOptionIndex = -1; // Initialize the selected option index

      // Loop through each radio button to find the selected correct answer
      for (let i = 1; i <= numOptions; i++) {
        const radioButton = document.querySelector(
          `input[name="correct-answer"][value="${i}"]`
        );
        if (radioButton && radioButton.checked) {
          selectedOptionIndex = i - 1; // Convert 1-based index to 0-based index
          break; // Exit the loop once the selected radio button is found
        }
      }

      // If a correct answer is selected, retrieve the corresponding option text
      if (selectedOptionIndex !== -1) {
        const selectedOptionTextbox = document.getElementById(
          `mc-option-${selectedOptionIndex + 1}`
        );
        correctAnswer = selectedOptionTextbox.value.trim();

        // Check if the selected correct answer is empty
        if (!correctAnswer) {
          alert("The correct answer cannot be empty.");
          return; // Exit the function without submitting the form
        }
      } else {
        alert("Please select a correct answer.");
        return; // Exit the function without submitting the form
      }

      // Retrieve all options
      for (let i = 1; i <= numOptions; i++) {
        const optionInput = document.getElementById(`mc-option-${i}`);
        const optionValue = optionInput.value.trim();
        if (optionValue) {
          options.push(optionValue);
        }
      }

      // Check if at least 2 options are provided
      if (options.length < 2) {
        alert("Please provide at least 2 options.");
        return; // Exit the function without submitting the form
      }

      // Save the question to IndexedDB
      saveQuestion(
        question,
        questionType,
        correctAnswer,
        options,
        selectedCategoryId
      );
    } else {
      alert(
        "Please fill in all required fields and provide between 2-4 options."
      );
      return; // Exit the function without submitting the form
    }

    console.log("Question:", question);
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
});
