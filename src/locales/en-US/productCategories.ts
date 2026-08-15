export default {
  title: "Product Categories",
  filters: { keyword: "Search category name" },
  columns: { name: "Category Name", path: "Category Path", sortOrder: "Sort", actions: "Actions" },
  actions: { create: "Create", edit: "Edit", delete: "Delete", cancel: "Cancel", save: "Save" },
  editor: { createTitle: "Create Category", updateTitle: "Edit Category" },
  form: { name: "Category Name", sortOrder: "Sort", parent: "Parent Category" },
  placeholders: {
    name: "Enter category name",
    sortOrder: "Enter a sort number",
    parent: "Select a parent category; leave empty for a top-level category",
  },
  validation: { name: "Please enter the category name", sortOrder: "Sort must be a non-negative integer" },
  delete: { title: "Delete Category", content: 'Are you sure you want to delete category "{name}"?' },
  messages: { created: "Category created", updated: "Category updated", deleted: "Category deleted" },
  empty: { data: "No category data", filtered: "No categories match the filter" },
};
