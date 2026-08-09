<template>
  <slot v-if="hasPermission"></slot>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { usePermissionsStore } from "@/stores/permissions.ts";

const permissionsStore = usePermissionsStore();
const hasPermission = ref<boolean>(false);

const props = defineProps({
  code: {
    type: String,
    required: true,
  },
});
onMounted(async () => {
  const permissionOutput = await permissionsStore.getPermissions();
  hasPermission.value = permissionOutput.buttonCodes.includes(props.code);
});
</script>

<style scoped lang="scss"></style>
