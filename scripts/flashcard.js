// scripts/flashcard.js

const flashcard = document.getElementById("flashcard");
const refreshBtn = document.querySelector(".refresh");
const questionContent = document.getElementById("flashcard--content_question");
const answerContent = document.getElementById("flashcard--content_answer");
let totalQuestions = 0; // Variable to store the total number of questions
let questionsSeen = new Set(); // Set to store questions already seen
let shuffledQuestions = []; // Array to store shuffled questions
let currentQuestionIndex = 0;
let answerStore; // Declare answerStore at the top level
let flashcardDataFetched = false; // Variable to track if flashcard data has been fetched

document.addEventListener("DOMContentLoaded", function () {
  // Fetch flashcard data from IndexedDB if not already fetched
  if (!flashcardDataFetched) {
    fetchFlashcardData();
    flashcardDataFetched = true;
  }
  // Add event listeners
  flashcard.addEventListener(
    "click",
    function () {
      this.classList.toggle("flipped");
    },
    false
  );

  refreshBtn.addEventListener(
    "click",
    function (e) {
      e.stopPropagation();
      e.preventDefault();
      refresh();
    },
    false
  );
});

function fetchFlashcardData() {
  openDB()
    .then((db) => {
      const transaction = db.transaction(["questions", "answers"], "readonly");
      const questionStore = transaction.objectStore("questions");
      const answerStore = transaction.objectStore("answers");
      const request = questionStore.getAll();

      request.onsuccess = function (event) {
        const questions = event.target.result;
        if (questions.length > 0) {
          // Retrieve the selected category from local storage
          let selectedCategory = localStorage.getItem("selectedCategory");

          console.log("Selected category:", selectedCategory);

          // If the selected category is "all", no filtering is needed
          if (selectedCategory === "all") {
            console.log("Displaying all questions.");
            shuffledQuestions = shuffleArray(questions);
          } else {
            // Filter questions based on the selected category
            const filteredQuestions = questions.filter(
              (question) => question.categoryId === selectedCategory
            );

            console.log("Filtered questions:", filteredQuestions);

            if (filteredQuestions.length > 0) {
              shuffledQuestions = shuffleArray(filteredQuestions);
            } else {
              console.log("No questions found in the selected category.");
            }
          }

          // Set the total number of questions
          totalQuestions = shuffledQuestions.length;

          // Display the first flashcard initially
          displayNextFlashcard(answerStore);
        } else {
          console.log("No questions found in IndexedDB.");
        }
      };

      request.onerror = function (event) {
        console.error("Error fetching flashcards:", event.target.error);
      };
    })
    .catch((error) => {
      console.error("Error opening database:", error);
    });
}

function displayNextFlashcard(answerStore) {
  console.log("currentQuestionIndex:", currentQuestionIndex);
  console.log("shuffledQuestions.length:", shuffledQuestions.length);

  // Check if all questions have been seen
  if (questionsSeen.size === totalQuestions) {
    console.log("All questions displayed.");
    // Show popup indicating that all questions were seen
    alert("All questions were seen.");
    return;
  }

  // Iterate through the shuffled questions
  while (currentQuestionIndex < shuffledQuestions.length) {
    const questionId = shuffledQuestions[currentQuestionIndex].id;

    // Check if the question has been seen before
    if (questionsSeen.has(questionId)) {
      console.log("Question already seen. Moving to the next question.");
      // If the question has been seen, move to the next one
    } else {
      // Check if the question type is "fc"
      if (shuffledQuestions[currentQuestionIndex].questionType === "fc") {
        const getRequest = answerStore.get(questionId);

        getRequest.onsuccess = function (event) {
          const answer = event.target.result;
          if (answer) {
            displayFlashcard(
              shuffledQuestions[currentQuestionIndex].question,
              answer.option
            );
            // Add the question to the set of seen questions
            questionsSeen.add(questionId);
          } else {
            console.log(
              "No answer found for question:",
              shuffledQuestions[currentQuestionIndex]
            );
          }
        };

        getRequest.onerror = function (event) {
          console.error("Error fetching answer:", event.target.error);
        };

        // Exit the loop after processing the current question
        return;
      } else {
        console.log("Skipping question with type other than 'fc'.");
      }
    }

    // Increment the currentQuestionIndex for the next iteration
    currentQuestionIndex++;
  }

  // If we reach this point, it means all questions have been seen
  console.log("All questions displayed.");
  alert("All questions were seen.");
}

function displayFlashcard(question, answer) {
  questionContent.textContent = question;
  answerContent.textContent = answer;
}

function refresh() {
  currentQuestionIndex = 0; // Reset currentQuestionIndex to 0
  fetchFlashcardData(); // Fetch the next flashcard
}

// Get the speaker button element
const speakerBtn = document.getElementById("speaker-btn");

// Add event listener to the speaker button
speakerBtn.addEventListener("click", function (event) {
  // Stop event propagation to prevent the card from flipping
  event.stopPropagation();

  // Check if the flashcard is flipped
  const isFlipped = document
    .getElementById("flashcard")
    .classList.contains("flipped");

  // Get the text content of the flashcard based on its state (question or answer)
  const textContent = isFlipped
    ? answerContent.textContent
    : questionContent.textContent;

  // Create a new SpeechSynthesisUtterance object with the text content
  const speech = new SpeechSynthesisUtterance(textContent);

  speech.lang = speechSynthesis.lang;
  console.log("language:", speech.lang);
  // Speak the text
  speechSynthesis.speak(speech);
});
