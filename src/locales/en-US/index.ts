import { common, defaultPageUnconfigured, noPermission, notFound, theme } from "./common";
import backendMessages from "./backendMessages";
import dataDictionaries from "./dataDictionaries";
import home from "./home";
import login from "./login";
import menu from "./menu";
import organizations from "./organizations";
import permissions from "./permissions";
import users from "./users";

export default {
  ...backendMessages,
  common,
  login,
  theme,
  menu,
  organizations,
  dataDictionaries,
  users,
  permissions,
  home,
  notFound,
  noPermission,
  defaultPageUnconfigured,
};
