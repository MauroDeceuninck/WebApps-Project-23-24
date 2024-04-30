document.addEventListener("DOMContentLoaded", function () {
  const flashcardOption = document.getElementById("flashcard-option");
  const mcOption = document.getElementById("mc-option");

  // Event listener for flashcard option button
  flashcardOption.addEventListener("click", function () {
    // Set the question type to flashcard
    localStorage.setItem("questionType", "flashcard");
    // Redirect to the study page
    window.location.href = "study_questions.html";
  });

  // Event listener for multiple choice option button
  mcOption.addEventListener("click", function () {
    // Set the question type to multiple choice
    localStorage.setItem("questionType", "multiple-choice");
    // Redirect to the study page
    window.location.href = "study_questions.html";
  });
});
