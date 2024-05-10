document.addEventListener("DOMContentLoaded", async function () {
  const categorySelect = document.getElementById("category-select");

  try {
    // Fetch categories from the database
    const categories = await getCategories();

    // Clear the default loading option
    categorySelect.innerHTML = "";

    // Add default "All" option
    const allOption = document.createElement("option");
    allOption.value = "all";
    allOption.textContent = "All";
    categorySelect.appendChild(allOption);

    // Populate dropdown with categories
    categories.forEach((category) => {
      const option = document.createElement("option");
      option.value = category.id;
      option.textContent = category.name;
      categorySelect.appendChild(option);
    });

    // Retrieve selected category from local storage
    let storedCategory = localStorage.getItem("selectedCategory");

    // If no category was previously selected, default to "All"
    if (!storedCategory) {
      storedCategory = "all";
    }

    // Set the selected option
    categorySelect.value = storedCategory;

    // Event listener for selecting a category
    categorySelect.addEventListener("change", function () {
      const selectedCategory = categorySelect.value;
      localStorage.setItem("selectedCategory", selectedCategory);
    });
    localStorage.setItem("selectedCategory", categorySelect.value);
  } catch (error) {
    console.error("Error fetching categories:", error);
  }
});
