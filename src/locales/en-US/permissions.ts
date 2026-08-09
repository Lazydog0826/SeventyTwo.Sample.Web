export default {
  title: "Permissions",
  filters: {
    keyword: "Search by title or code",
    type: "Permission type",
    status: "Status",
  },
  types: {
    directory: "Directory",
    page: "Page",
    button: "Button",
  },
  statuses: {
    enabled: "Enabled",
    disabled: "Disabled",
  },
  columns: {
    title: "Title",
    code: "Code",
    type: "Type",
    status: "Status",
    sortOrder: "Order",
    icon: "Icon",
    routePath: "Route Path",
    routeName: "Route Name",
    componentPath: "Component Path",
    metaData: "Route Metadata",
  },
  metaData: {
    show: "Visible",
    hide: "Hidden",
  },
  empty: {
    data: "No permissions",
    filtered: "No permissions match the filters",
  },
};
