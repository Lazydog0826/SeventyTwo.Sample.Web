// noinspection JSUnusedGlobalSymbols

import type { Component } from "vue";

export type ViewLoader = () => Promise<Component>;

export const viewModules = import.meta.glob<Component>("@/views/**/*.vue", {
  import: "default",
});

export const layout = import("@/layout/index.vue");

console.log(viewModules, "viewModules123");
