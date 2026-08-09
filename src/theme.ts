import { computed, ref, shallowRef, watch } from "vue";
import { darkTheme, type GlobalThemeOverrides } from "naive-ui";

/*
red: 红色
orangered: 橙红色
orange: 橙色
gold: 金色
yellow: 黄色
lime: 青柠色
green: 绿色
cyan: 青色
blue: 蓝色
arcoblue: Arco 蓝
purple: 紫色
pinkpurple: 粉紫色
magenta: 品红色
gray: 灰色
*/
const semanticPalettes = {
  primary: "cyan",
  info: "blue",
  success: "green",
  warning: "orange",
  error: "red",
} as const;

function getPaletteColor(palette: string, shade: number) {
  return getComputedStyle(document.documentElement).getPropertyValue(`--color-${palette}-${shade}`).trim();
}

function createThemeOverrides(): GlobalThemeOverrides {
  const common: NonNullable<GlobalThemeOverrides["common"]> = {};

  for (const [semantic, palette] of Object.entries(semanticPalettes)) {
    const name = `${semantic}Color`;
    Object.assign(common, {
      [name]: getPaletteColor(palette, 6),
      [`${name}Hover`]: getPaletteColor(palette, 5),
      [`${name}Pressed`]: getPaletteColor(palette, 7),
      [`${name}Suppl`]: getPaletteColor(palette, 5),
    });
  }

  return { common };
}

export const isDark = ref(localStorage.getItem("theme") === "dark");

export const themeOverrides = shallowRef<GlobalThemeOverrides>({});

export const syncThemeOverrides = () => {
  themeOverrides.value = createThemeOverrides();
  document.documentElement.style.setProperty("--bprogress-color", getPaletteColor(semanticPalettes.primary, 6));
};

export const configProviderProps = computed(() => ({
  theme: isDark.value ? darkTheme : null,
  themeOverrides: themeOverrides.value,
}));

export const toggleTheme = () => {
  isDark.value = !isDark.value;
  localStorage.setItem("theme", isDark.value ? "dark" : "light");
};

watch(
  isDark,
  value => {
    document.documentElement.dataset.theme = value ? "dark" : "light";
    syncThemeOverrides();
  },
  { immediate: true, flush: "sync" }
);
