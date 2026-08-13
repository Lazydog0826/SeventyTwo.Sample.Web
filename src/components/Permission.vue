<template>
  <slot v-if="hasPermission"></slot>
</template>

<script lang="ts" setup>
import { computed, onMounted } from "vue";
import { type PermissionMatchMode, usePermissionsStore } from "@/stores/permissions.ts";

const permissionsStore = usePermissionsStore();

const props = withDefaults(
  defineProps<{
    code?: string;
    codes?: readonly string[];
    mode?: PermissionMatchMode;
  }>(),
  { mode: "Any" }
);

const permissionCodes = computed<readonly string[]>(() => {
  const hasCode = Boolean(props.code);
  const hasCodes = props.codes !== undefined;
  if (hasCode === hasCodes) return [];
  return hasCodes ? props.codes! : [props.code!];
});
const hasPermission = computed(() => permissionsStore.hasPermissions(permissionCodes.value, props.mode));

onMounted(async () => {
  await permissionsStore.getPermissions();
});
</script>

<style lang="scss" scoped></style>
