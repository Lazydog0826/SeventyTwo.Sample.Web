import { common, defaultPageUnconfigured, language, noPermission, notFound, theme } from "./common";
import backendMessages from "./backendMessages";
import dataDictionaries from "./dataDictionaries";
import home from "./home";
import login from "./login";
import menu from "./menu";
import organizations from "./organizations";
import permissions from "./permissions";
import productCategories from "./productCategories";
import products from "./products";
import users from "./users";

export default {
  ...backendMessages,
  common,
  login,
  theme,
  language,
  menu,
  organizations,
  dataDictionaries,
  users,
  permissions,
  productCategories,
  products,
  home,
  notFound,
  noPermission,
  defaultPageUnconfigured,
};
