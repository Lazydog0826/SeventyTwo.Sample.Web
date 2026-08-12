<template>
  <div class="user-list-page">
    <n-card :bordered="false" :title="t('users.title')">
      <div class="toolbar">
        <n-space :wrap="true">
          <n-input v-model:value="keyword" clearable :placeholder="t('users.filters.keyword')" class="keyword-input" />
          <n-select
            v-model:value="statusFilter"
            clearable
            :placeholder="t('users.filters.status')"
            :options="statusOptions"
            class="status-select"
          />
        </n-space>
        <n-button v-if="canCreate" type="primary" @click="openCreate">{{ t("users.actions.create") }}</n-button>
      </div>
      <n-data-table
        :columns="columns"
        :data="filteredUsers"
        :loading="loading"
        :row-key="row => row.id"
        :scroll-x="hasActions ? 1040 : 880"
        striped
      >
        <template #empty><n-empty :description="emptyDescription" /></template>
      </n-data-table>
    </n-card>

    <n-modal
      v-model:show="showEditor"
      preset="card"
      :title="editorTitle"
      style="width: 560px; max-width: calc(100vw - 32px)"
    >
      <n-form ref="formRef" :model="formModel" :rules="formRules" label-placement="left" label-width="auto">
        <n-form-item :label="t('users.form.username')" path="username"
          ><n-input
            v-model:value="formModel.username"
            :disabled="Boolean(formModel.id)"
            :placeholder="t('users.placeholders.username')"
        /></n-form-item>
        <n-form-item v-if="!formModel.id" :label="t('users.form.password')" path="password"
          ><n-input
            v-model:value="formModel.password"
            type="password"
            show-password-on="click"
            :placeholder="t('users.placeholders.password')"
        /></n-form-item>
        <n-form-item :label="t('users.form.displayName')" path="displayName"
          ><n-input v-model:value="formModel.displayName" :placeholder="t('users.placeholders.displayName')"
        /></n-form-item>
        <n-form-item :label="t('users.form.phone')" path="phone"
          ><n-input v-model:value="formModel.phone" :placeholder="t('users.placeholders.phone')"
        /></n-form-item>
        <n-form-item :label="t('users.form.email')" path="email"
          ><n-input v-model:value="formModel.email" :placeholder="t('users.placeholders.email')"
        /></n-form-item>
        <n-form-item :label="t('users.form.organization')" path="orgId"
          ><n-select
            v-model:value="formModel.orgId"
            :options="organizationOptions"
            :loading="organizationsLoading"
            :placeholder="t('users.placeholders.organization')"
            filterable
        /></n-form-item>
        <n-form-item v-if="!formModel.id" :label="t('users.form.enable')"
          ><n-switch v-model:value="formModel.enable"
        /></n-form-item>
      </n-form>
      <template #footer
        ><n-space justify="end"
          ><n-button @click="showEditor = false">{{ t("users.actions.cancel") }}</n-button
          ><n-button type="primary" :loading="submitting" @click="submitEditor">{{
            t("users.actions.save")
          }}</n-button></n-space
        ></template
      >
    </n-modal>

    <n-modal v-model:show="showDeleteConfirm" preset="dialog" type="warning" :title="t('users.delete.title')">
      {{ t("users.delete.content", { name: deletingUser?.displayName ?? "" }) }}
      <template #action
        ><n-space justify="end"
          ><n-button @click="showDeleteConfirm = false">{{ t("users.actions.cancel") }}</n-button
          ><n-button type="error" :loading="deleting" @click="confirmDelete">{{
            t("users.actions.delete")
          }}</n-button></n-space
        ></template
      >
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, h, onMounted, reactive, ref } from "vue";
import {
  NButton,
  NCard,
  NDataTable,
  NEllipsis,
  NEmpty,
  NForm,
  NFormItem,
  NInput,
  NModal,
  NSelect,
  NSpace,
  NSwitch,
  NTag,
  type DataTableColumns,
  type FormInst,
  type FormRules,
} from "naive-ui";
import { createUser, deleteUser, getUserList, setUserEnable, updateUser, type UserListOutput } from "@/api/users.ts";
import { getUserOrganizationOptions, type OrganizationListOutput } from "@/api/organizations.ts";
import { PermissionCode } from "@/constants/permissions.ts";
import { SystemUsername } from "@/constants/users.ts";
import { usePermissionsStore } from "@/stores/permissions.ts";
import { useI18n } from "vue-i18n";

type StatusFilter = "enabled" | "disabled";
interface UserFormModel {
  id: string | null;
  version: string | null;
  username: string;
  password: string;
  displayName: string;
  phone: string;
  email: string;
  orgId: string | null;
  enable: boolean;
}
const { t } = useI18n();
const permissionsStore = usePermissionsStore();
const users = ref<UserListOutput[]>([]);
const organizations = ref<OrganizationListOutput[]>([]);
const keyword = ref("");
const statusFilter = ref<StatusFilter | null>(null);
const loading = ref(false);
const organizationsLoading = ref(false);
const submitting = ref(false);
const deleting = ref(false);
const enablingIds = ref(new Set<string>());
const showEditor = ref(false);
const showDeleteConfirm = ref(false);
const deletingUser = ref<UserListOutput | null>(null);
const formRef = ref<FormInst | null>(null);
const formModel = reactive<UserFormModel>(emptyForm());
const canCreate = computed(() => permissionsStore.hasPermission(PermissionCode.UsersCreate));
const canUpdate = computed(() => permissionsStore.hasPermission(PermissionCode.UsersUpdate));
const canDelete = computed(() => permissionsStore.hasPermission(PermissionCode.UsersDelete));
const hasActions = computed(() => canUpdate.value || canDelete.value);
const hasFilter = computed(() => Boolean(keyword.value.trim()) || statusFilter.value !== null);
const filteredUsers = computed(() => {
  const value = keyword.value.trim().toLocaleLowerCase();
  return users.value.filter(
    user =>
      (!value ||
        [user.username, user.displayName, user.phone, user.email].some(field =>
          field.toLocaleLowerCase().includes(value)
        )) &&
      (statusFilter.value === null || (statusFilter.value === "enabled" ? user.enable : !user.enable))
  );
});
const emptyDescription = computed(() => t(hasFilter.value ? "users.empty.filtered" : "users.empty.data"));
const editorTitle = computed(() => t(formModel.id ? "users.editor.updateTitle" : "users.editor.createTitle"));
const statusOptions = computed(() => [
  { label: t("users.statuses.enabled"), value: "enabled" },
  { label: t("users.statuses.disabled"), value: "disabled" },
]);
const organizationOptions = computed(() =>
  organizations.value
    .filter(item => item.enable)
    .map(item => ({ label: `${item.name} (${item.code})`, value: item.id }))
);
const formRules = computed<FormRules>(() => ({
  username: {
    required: true,
    validator: (_rule, value) =>
      typeof value === "string" && value.trim().length >= 3 && value.trim().length <= 50
        ? true
        : new Error(t("users.validation.username")),
    trigger: ["input", "blur"],
  },
  password: {
    required: !formModel.id,
    validator: (_rule, value) =>
      formModel.id || (typeof value === "string" && value.length >= 6 && value.length <= 100)
        ? true
        : new Error(t("users.validation.password")),
    trigger: ["input", "blur"],
  },
  displayName: requiredRule("displayName"),
  phone: requiredRule("phone"),
  email: requiredRule("email"),
  orgId: { required: true, message: t("users.validation.organization"), trigger: ["change", "blur"] },
}));
const columns = computed<DataTableColumns<UserListOutput>>(() => {
  const result: DataTableColumns<UserListOutput> = [
    { title: t("users.columns.username"), key: "username", width: 160, fixed: "left" },
    { title: t("users.columns.displayName"), key: "displayName", width: 160 },
    { title: t("users.columns.phone"), key: "phone", width: 170 },
    {
      title: t("users.columns.email"),
      key: "email",
      width: 230,
      render: row => h(NEllipsis, { tooltip: true }, { default: () => row.email }),
    },
    {
      title: t("users.columns.status"),
      key: "enable",
      width: 110,
      render: row =>
        canUpdate.value
          ? h(NSwitch, {
              value: row.enable,
              disabled: row.username === SystemUsername.SuperAdmin,
              loading: enablingIds.value.has(row.id),
              "onUpdate:value": value => changeEnable(row, value),
            })
          : h(
              NTag,
              { type: row.enable ? "success" : "error", bordered: false },
              { default: () => t(row.enable ? "users.statuses.enabled" : "users.statuses.disabled") }
            ),
    },
  ];
  if (hasActions.value)
    result.push({
      title: t("users.columns.actions"),
      key: "actions",
      width: 160,
      fixed: "right",
      render: row =>
        h(NSpace, null, {
          default: () => [
            canUpdate.value
              ? h(
                  NButton,
                  {
                    text: true,
                    type: "primary",
                    disabled: row.username === SystemUsername.SuperAdmin,
                    onClick: () => openEdit(row),
                  },
                  { default: () => t("users.actions.edit") }
                )
              : null,
            canDelete.value
              ? h(
                  NButton,
                  {
                    text: true,
                    type: "error",
                    disabled: row.username === SystemUsername.SuperAdmin,
                    onClick: () => openDelete(row),
                  },
                  { default: () => t("users.actions.delete") }
                )
              : null,
          ],
        }),
    });
  return result;
});
function requiredRule(field: "displayName" | "phone" | "email") {
  return { required: true, whitespace: true, message: t(`users.validation.${field}`), trigger: ["input", "blur"] };
}
function emptyForm(): UserFormModel {
  return {
    id: null,
    version: null,
    username: "",
    password: "",
    displayName: "",
    phone: "",
    email: "",
    orgId: null,
    enable: true,
  };
}
function openCreate() {
  Object.assign(formModel, emptyForm());
  showEditor.value = true;
}
function openEdit(user: UserListOutput) {
  Object.assign(formModel, { ...user, password: "" });
  showEditor.value = true;
}
function openDelete(user: UserListOutput) {
  deletingUser.value = user;
  showDeleteConfirm.value = true;
}
async function submitEditor() {
  await formRef.value?.validate();
  submitting.value = true;
  try {
    if (!formModel.orgId) return;
    if (formModel.id && formModel.version) {
      await updateUser({
        id: formModel.id,
        version: formModel.version,
        displayName: formModel.displayName,
        phone: formModel.phone,
        email: formModel.email,
        orgId: formModel.orgId,
      });
      window.$message.success(t("users.messages.updated"));
    } else {
      await createUser({
        username: formModel.username,
        password: formModel.password,
        displayName: formModel.displayName,
        phone: formModel.phone,
        email: formModel.email,
        enable: formModel.enable,
        orgId: formModel.orgId,
      });
      window.$message.success(t("users.messages.created"));
    }
    showEditor.value = false;
    await loadUsers();
  } finally {
    submitting.value = false;
  }
}
async function changeEnable(user: UserListOutput, enable: boolean) {
  enablingIds.value = new Set(enablingIds.value).add(user.id);
  try {
    await setUserEnable(user.id, enable, user.version);
    window.$message.success(t(enable ? "users.messages.enabled" : "users.messages.disabled"));
    await loadUsers();
  } finally {
    const ids = new Set(enablingIds.value);
    ids.delete(user.id);
    enablingIds.value = ids;
  }
}
async function confirmDelete() {
  if (!deletingUser.value) return;
  deleting.value = true;
  try {
    await deleteUser(deletingUser.value.id, deletingUser.value.version);
    window.$message.success(t("users.messages.deleted"));
    showDeleteConfirm.value = false;
    deletingUser.value = null;
    await loadUsers();
  } finally {
    deleting.value = false;
  }
}
async function loadUsers() {
  loading.value = true;
  try {
    users.value = (await getUserList()) ?? [];
  } finally {
    loading.value = false;
  }
}
async function loadOrganizations() {
  organizationsLoading.value = true;
  try {
    organizations.value = (await getUserOrganizationOptions()) ?? [];
  } finally {
    organizationsLoading.value = false;
  }
}
onMounted(() => Promise.all([loadUsers(), loadOrganizations(), permissionsStore.getPermissions()]));
</script>

<style scoped lang="scss">
.user-list-page {
  min-width: 0;
}
.toolbar {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}
.keyword-input {
  width: 300px;
}
.status-select {
  width: 160px;
}
@media (max-width: 640px) {
  .toolbar {
    align-items: stretch;
    flex-direction: column;
  }
  .keyword-input,
  .status-select {
    width: 100%;
  }
}
</style>
