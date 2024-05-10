function addCategory() {
  const newCategory = document.getElementById("new-category").value;

  // Check if the category already exists
  categoryExists(newCategory)
    .then((exists) => {
      if (exists) {
        alert("Category already exists.");
      } else {
        // If the category doesn't exist, add it to the database
        CategoryToDB(newCategory);
        // After adding the category, display the updated list of categories
        displayCategories();
        // Clear the input field
        document.getElementById("new-category").value = "";
      }
    })
    .catch((error) => {
      console.error("Error checking category existence:", error);
    });
}

function categoryExists(categoryName) {
  return new Promise((resolve, reject) => {
    openDB()
      .then((db) => {
        const transaction = db.transaction("categories", "readonly");
        const categoryStore = transaction.objectStore("categories");
        const request = categoryStore.getAll();

        request.onsuccess = (event) => {
          const categories = event.target.result;
          const exists = categories.some(
            (category) => category.name === categoryName
          );
          resolve(exists);
        };

        request.onerror = (event) => {
          reject(event.target.error);
        };
      })
      .catch((error) => {
        reject(error);
      });
  });
}

function CategoryToDB(categoryName) {
  openDB()
    .then((db) => {
      const transaction = db.transaction("categories", "readwrite");
      const categoryStore = transaction.objectStore("categories");

      console.log("Adding category:", categoryName);
      const category = { name: categoryName };
      const request = categoryStore.add(category);

      request.onsuccess = () => {
        console.log("Category added successfully:", categoryName);
      };

      request.onerror = (event) => {
        console.error("Error adding category:", event.target.error);
      };
    })
    .catch((error) => {
      console.error("Error opening database:", error);
    });
}

window.addEventListener("DOMContentLoaded", function () {
  displayCategories();
});

function displayCategories() {
  openDB()
    .then((db) => {
      const transaction = db.transaction("categories", "readonly");
      const categoryStore = transaction.objectStore("categories");
      const request = categoryStore.getAll();

      request.onsuccess = (event) => {
        const categories = event.target.result;
        renderCategories(categories);
      };

      request.onerror = (event) => {
        console.error("Error fetching categories:", event.target.error);
      };
    })
    .catch((error) => {
      console.error("Error opening database:", error);
    });
}

function renderCategories(categories) {
  const categoryList = document.getElementById("categories");
  categoryList.innerHTML = ""; // Clear existing list

  categories.forEach((category) => {
    const listItem = document.createElement("li");
    listItem.textContent = category.name;

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", () => {
      deleteCategory(category.id); // Call a function to delete the category from the database
    });

    listItem.appendChild(deleteButton);
    categoryList.appendChild(listItem);
  });
}

function deleteCategory(categoryId) {
  openDB()
    .then((db) => {
      const transaction = db.transaction("categories", "readwrite");
      const categoryStore = transaction.objectStore("categories");

      const request = categoryStore.delete(categoryId);

      request.onsuccess = () => {
        console.log("Category deleted successfully");
        // After successful deletion, re-render the category list
        displayCategories();
      };

      request.onerror = (event) => {
        console.error("Error deleting category:", event.target.error);
      };
    })
    .catch((error) => {
      console.error("Error opening database:", error);
    });
}
