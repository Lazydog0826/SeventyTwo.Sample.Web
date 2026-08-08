// noinspection JSUnusedGlobalSymbols

import type { Component } from "vue";

export type ViewLoader = () => Promise<Component>;

export const viewModules = import.meta.glob<Component>("../views/**/*.vue", {
  import: "default",
});
