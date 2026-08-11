import { common, notFound, theme } from "./common";
import backendMessages from "./backendMessages";
import home from "./home";
import login from "./login";
import menu from "./menu";
import permissions from "./permissions";

export default {
  ...backendMessages,
  common,
  login,
  theme,
  menu,
  permissions,
  home,
  notFound,
};
