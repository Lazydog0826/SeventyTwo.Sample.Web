export default {
  title: "Organizations",
  filters: { keyword: "Search organization name or code", status: "Organization status" },
  columns: { name: "Name", code: "Code", status: "Status", actions: "Actions" },
  statuses: { enabled: "Enabled", disabled: "Disabled" },
  actions: { create: "New organization", edit: "Edit", delete: "Delete", cancel: "Cancel", save: "Save" },
  editor: { createTitle: "New organization", updateTitle: "Edit organization" },
  form: { code: "Code", name: "Name", parent: "Parent organization", enable: "Enabled" },
  placeholders: {
    code: "Enter organization code",
    name: "Enter organization name",
    parent: "Select a parent; leave empty to create a root",
  },
  validation: { code: "Enter organization code", name: "Enter organization name" },
  delete: { title: "Delete organization", content: "Permanently delete “{name}”? This action cannot be undone." },
  messages: { created: "Organization created", updated: "Organization updated", deleted: "Organization deleted" },
  empty: { data: "No organizations", filtered: "No organizations match the filters" },
};
