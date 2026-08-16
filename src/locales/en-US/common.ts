// noinspection JSUnusedGlobalSymbols
export default {
  login: "Login",
  logout: "Logout",
  loggingOut: "Logging out…",
  // Placeholder options for the user dropdown; remove featurePending once implemented.
  profile: "Profile",
  accountSettings: "Account settings",
  changePassword: "Change password",
  featurePending: "This feature is under development",
  loading: "Loading",
  menuLoading: "Loading menu",
  expandSidebar: "Expand sidebar",
  collapseSidebar: "Collapse sidebar",
  // 会话失效提示，供 request.ts 认证失败流程弹出消息使用。
  sessionExpired: "Your session has expired. Please log in again.",
  tokenRefreshStillUnauthorized: "Request still unauthorized after refreshing the session",
  // 通用表格列设置组件（ColumnSettings.vue）文案。
  columnSettings: {
    title: "Column settings",
    reset: "Reset to default",
  },
};
