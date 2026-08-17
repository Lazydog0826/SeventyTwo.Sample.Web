<template>
  <div class="user-list-page">
    <n-card :bordered="false">
      <!-- 布局规范与商品列表页一致：筛选区一行五列，搜索/重置按钮固定第一行最后一列，不足五列用空项补齐。 -->
      <div class="toolbar">
        <n-grid :cols="5" :x-gap="16" :y-gap="16">
          <n-gi>
            <n-input
              v-model:value="keyword"
              :disabled="actionLoading"
              :placeholder="t('users.filters.keyword')"
              clearable
              @keyup.enter="searchUsers"
            />
          </n-gi>
          <n-gi>
            <n-select
              v-model:value="statusFilter"
              :disabled="actionLoading"
              :options="statusOptions"
              :placeholder="t('users.filters.status')"
              clearable
            />
          </n-gi>
          <n-gi />
          <n-gi />
          <n-gi>
            <div class="filter-actions">
              <n-button :disabled="actionLoading" type="primary" @click="searchUsers">
                {{ t("users.actions.search") }}
              </n-button>
              <n-button :disabled="actionLoading" @click="resetFilters">{{ t("users.actions.reset") }}</n-button>
            </div>
          </n-gi>
        </n-grid>
        <!-- 操作区左右分区：左侧业务操作（新建），右侧统一操作（刷新/列设置），与商品列表页一致。 -->
        <div class="action-bar">
          <n-grid :x-gap="16" :y-gap="12" cols="1 s:2" responsive="screen">
            <n-gi>
              <n-space>
                <n-button v-if="canCreate" :disabled="actionLoading" type="primary" @click="openCreate">
                  {{ t("users.actions.create") }}
                </n-button>
              </n-space>
            </n-gi>
            <n-gi>
              <n-space justify="end">
                <n-button
                  :aria-label="t('users.actions.refresh')"
                  :disabled="actionLoading"
                  :title="t('users.actions.refresh')"
                  quaternary
                  @click="refreshUsers"
                >
                  <template #icon>
                    <n-icon>
                      <RefreshCw :size="16" :stroke-width="1.5"></RefreshCw>
                    </n-icon>
                  </template>
                </n-button>
                <ColumnSettings
                  :hidden-keys="hiddenKeys"
                  :items="columnSettingItems"
                  :ordered-keys="orderedKeys"
                  @move="moveColumn"
                  @reset="resetColumns"
                  @toggle="toggleColumn"
                >
                  <template #trigger>
                    <n-button :aria-label="t('users.actions.settings')" :title="t('users.actions.settings')" quaternary>
                      <template #icon>
                        <n-icon>
                          <Settings :size="16" :stroke-width="1.5"></Settings>
                        </n-icon>
                      </template>
                    </n-button>
                  </template>
                </ColumnSettings>
              </n-space>
            </n-gi>
          </n-grid>
        </div>
      </div>
      <n-data-table
        :columns="columns"
        :data="users"
        :loading="loading"
        :pagination="pagination"
        :row-key="row => row.id"
        :scroll-x="scrollX"
        flex-height
        remote
        striped
        style="height: 100%"
      >
        <template #empty><n-empty :description="emptyDescription" /></template>
      </n-data-table>
    </n-card>

    <n-modal
      v-model:show="showEditor"
      :closable="!submitting"
      :close-on-esc="!submitting"
      :mask-closable="!submitting"
      :title="editorTitle"
      preset="card"
      style="width: 560px; max-width: calc(100vw - 32px)"
    >
      <n-form ref="formRef" :model="formModel" :rules="formRules" label-placement="left" label-width="auto">
        <n-form-item :label="t('users.form.username')" path="username">
          <n-input
            v-model:value="formModel.username"
            :disabled="Boolean(formModel.id)"
            :placeholder="t('users.placeholders.username')"
          />
        </n-form-item>
        <n-form-item v-if="!formModel.id" :label="t('users.form.password')" path="password">
          <n-input
            v-model:value="formModel.password"
            :placeholder="t('users.placeholders.password')"
            show-password-on="click"
            type="password"
          />
        </n-form-item>
        <n-form-item :label="t('users.form.displayName')" path="displayName">
          <n-input v-model:value="formModel.displayName" :placeholder="t('users.placeholders.displayName')" />
        </n-form-item>
        <n-form-item :label="t('users.form.phone')" path="phone">
          <n-input v-model:value="formModel.phone" :placeholder="t('users.placeholders.phone')" />
        </n-form-item>
        <n-form-item :label="t('users.form.email')" path="email">
          <n-input v-model:value="formModel.email" :placeholder="t('users.placeholders.email')" />
        </n-form-item>
        <n-form-item :label="t('users.form.organization')" path="orgId">
          <n-tree-select
            v-model:value="formModel.orgId"
            :loading="organizationsLoading"
            :options="organizationOptions"
            :placeholder="t('users.placeholders.organization')"
            filterable
          />
        </n-form-item>
        <n-form-item :label="t('users.form.dataPermissionType')" path="dataPermissionType">
          <n-select
            v-model:value="formModel.dataPermissionType"
            :options="dataPermissionTypeOptions"
            :placeholder="t('users.placeholders.dataPermissionType')"
          />
        </n-form-item>
        <n-form-item :label="t('users.form.defaultPage')" path="defaultPageId">
          <n-tree-select
            v-model:value="formModel.defaultPageId"
            :loading="defaultPagesLoading"
            :options="defaultPageOptions"
            :placeholder="t('users.placeholders.defaultPage')"
            clearable
            filterable
          />
        </n-form-item>
        <n-form-item v-if="!formModel.id" :label="t('users.form.enable')">
          <n-switch v-model:value="formModel.enable" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button :disabled="submitting" @click="showEditor = false">{{ t("users.actions.cancel") }}</n-button>
          <n-button :loading="submitting" type="primary" @click="submitEditor">
            {{ t("users.actions.save") }}
          </n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal
      v-model:show="showAuthorization"
      :closable="!authorizationSaving"
      :close-on-esc="!authorizationSaving"
      :mask-closable="!authorizationSaving"
      :title="t('users.authorization.title', { name: authorizingUser?.displayName ?? '' })"
      preset="card"
      style="width: 640px; max-width: calc(100vw - 32px)"
    >
      <n-spin :show="authorizationLoading">
        <n-tree
          v-if="authorizationOptions.length"
          :checked-keys="authorizationCheckedKeys"
          :data="authorizationOptions"
          :indeterminate-keys="authorizationIndeterminateKeys"
          block-line
          checkable
          default-expand-all
          @update:checked-keys="handleAuthorizationCheck"
        />
        <n-empty v-else :description="t('users.authorization.empty')" />
      </n-spin>
      <template #footer>
        <n-space justify="end">
          <n-button :disabled="authorizationSaving" @click="showAuthorization = false">
            {{ t("users.actions.cancel") }}
          </n-button>
          <n-button
            :disabled="authorizationLoading"
            :loading="authorizationSaving"
            type="primary"
            @click="saveAuthorization"
          >
            {{ t("users.actions.save") }}
          </n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal
      v-model:show="showDeleteConfirm"
      :closable="!deleting"
      :close-on-esc="!deleting"
      :mask-closable="!deleting"
      :show-icon="true"
      :title="t('users.delete.title')"
      preset="dialog"
      type="warning"
    >
      {{ t("users.delete.content", { name: deletingUser?.displayName ?? "" }) }}
      <template #action>
        <n-space justify="end">
          <n-button :disabled="deleting" @click="showDeleteConfirm = false">{{ t("users.actions.cancel") }}</n-button>
          <n-button :loading="deleting" type="error" @click="confirmDelete">{{ t("users.actions.delete") }}</n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal
      v-model:show="showResetPasswordConfirm"
      :closable="!resettingPassword"
      :close-on-esc="!resettingPassword"
      :mask-closable="!resettingPassword"
      :title="t('users.resetPassword.confirmTitle')"
      preset="dialog"
      type="warning"
    >
      {{ t("users.resetPassword.confirmContent", { name: resettingUser?.displayName ?? "" }) }}
      <template #action>
        <n-space justify="end">
          <n-button :disabled="resettingPassword" @click="showResetPasswordConfirm = false">
            {{ t("users.actions.cancel") }}
          </n-button>
          <n-button :loading="resettingPassword" type="warning" @click="confirmResetPassword">
            {{ t("users.actions.resetPassword") }}
          </n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal
      v-model:show="showResetPasswordResult"
      :title="t('users.resetPassword.resultTitle')"
      preset="card"
      style="width: 520px; max-width: calc(100vw - 32px)"
      @after-leave="resetPasswordResult = ''"
    >
      <n-alert :bordered="false" type="warning">{{ t("users.resetPassword.resultHint") }}</n-alert>
      <n-input :value="resetPasswordResult" class="reset-password-value" readonly />
      <template #footer>
        <n-space justify="end">
          <n-button @click="showResetPasswordResult = false">{{ t("users.actions.close") }}</n-button>
          <n-button type="primary" @click="copyResetPassword">{{ t("users.actions.copy") }}</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script lang="ts" setup>
import { computed, h, onMounted, reactive, ref } from "vue";
import {
  type DataTableColumn,
  type DataTableColumns,
  type FormInst,
  type FormRules,
  NAlert,
  NButton,
  NCard,
  NDataTable,
  NEllipsis,
  NEmpty,
  NForm,
  NFormItem,
  NGi,
  NGrid,
  NIcon,
  NInput,
  NModal,
  NSelect,
  NSpace,
  NSpin,
  NSwitch,
  NTag,
  NTree,
  NTreeSelect,
  type PaginationProps,
  type TreeOption,
  type TreeSelectOption,
} from "naive-ui";
import { RefreshCw, Settings } from "@lucide/vue";
import type { DataPermissionType } from "@/api/users.ts";
import {
  authorizeUser,
  createUser,
  type DefaultPageOptionOutput,
  deleteUser,
  getDefaultPageOptions,
  getUserAuthorization,
  getUserDetail,
  getUserList,
  resetUserPassword,
  setUserEnable,
  updateUser,
  type UserListOutput,
} from "@/api/users.ts";
import type { PermissionListOutput } from "@/api/permissions.ts";
import { getUserOrganizationOptions, type OrganizationListOutput } from "@/api/organizations.ts";
import ColumnSettings from "@/components/ColumnSettings.vue";
import { useColumnSettings } from "@/composables/useColumnSettings.ts";
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
  dataPermissionType: DataPermissionType;
  defaultPageId: string | null;
  enable: boolean;
}
const { t, te } = useI18n();
const permissionsStore = usePermissionsStore();
const users = ref<UserListOutput[]>([]);
const organizations = ref<OrganizationListOutput[]>([]);
const defaultPages = ref<DefaultPageOptionOutput[]>([]);
const keyword = ref("");
const statusFilter = ref<StatusFilter | null>(null);
const appliedKeyword = ref("");
const appliedStatus = ref<StatusFilter | null>(null);
const pagination = reactive<PaginationProps>({
  page: 1,
  pageSize: 20,
  itemCount: 0,
  pageSizes: [10, 20, 50, 100],
  showSizePicker: true,
  onChange: page => {
    if (actionLoading.value) return;
    pagination.page = page;
    void loadUsers();
  },
  onUpdatePageSize: pageSize => {
    if (actionLoading.value) return;
    pagination.pageSize = pageSize;
    pagination.page = 1;
    void loadUsers();
  },
});
const loading = ref(false);
const organizationsLoading = ref(false);
const defaultPagesLoading = ref(false);
const submitting = ref(false);
const deleting = ref(false);
const resettingPassword = ref(false);
const editingLoadingId = ref<string | null>(null);
let editRequestSequence = 0;
const enablingIds = ref(new Set<string>());
const showEditor = ref(false);
const showDeleteConfirm = ref(false);
const showResetPasswordConfirm = ref(false);
const showResetPasswordResult = ref(false);
const showAuthorization = ref(false);
const authorizationLoading = ref(false);
// 页面操作统一互斥，避免列表刷新与增删改等异步请求并发修改界面状态。
const actionLoading = computed(
  () =>
    loading.value ||
    submitting.value ||
    deleting.value ||
    resettingPassword.value ||
    editingLoadingId.value !== null ||
    authorizationLoading.value ||
    authorizationSaving.value ||
    enablingIds.value.size > 0
);
const authorizationSaving = ref(false);
const authorizingUser = ref<UserListOutput | null>(null);
const authorizationOptions = ref<TreeOption[]>([]);
const authorizationCheckedKeys = ref<Array<string | number>>([]);
const authorizationIndeterminateKeys = ref<Array<string | number>>([]);
const authorizationSelectedIds = ref(new Set<string>());
const authorizationPermissions = ref<PermissionListOutput[]>([]);
const deletingUser = ref<UserListOutput | null>(null);
const resettingUser = ref<UserListOutput | null>(null);
const resetPasswordResult = ref("");
const formRef = ref<FormInst | null>(null);
const formModel = reactive<UserFormModel>(emptyForm());
const canCreate = computed(() => permissionsStore.hasPermission(PermissionCode.UsersCreate));
const canUpdate = computed(() => permissionsStore.hasPermission(PermissionCode.UsersUpdate));
const canDelete = computed(() => permissionsStore.hasPermission(PermissionCode.UsersDelete));
const canAuthorize = computed(() => permissionsStore.hasPermission(PermissionCode.UsersAuthorize));
const canResetPassword = computed(() => permissionsStore.hasPermission(PermissionCode.UsersResetPassword));
const hasActions = computed(() => canUpdate.value || canAuthorize.value || canResetPassword.value || canDelete.value);
const hasFilter = computed(() => Boolean(appliedKeyword.value) || appliedStatus.value !== null);
const emptyDescription = computed(() => t(hasFilter.value ? "users.empty.filtered" : "users.empty.data"));
const editorTitle = computed(() => t(formModel.id ? "users.editor.updateTitle" : "users.editor.createTitle"));
const statusOptions = computed(() => [
  { label: t("users.statuses.enabled"), value: "enabled" },
  { label: t("users.statuses.disabled"), value: "disabled" },
]);
const organizationOptions = computed<TreeSelectOption[]>(() => buildOrganizationOptions(organizations.value));
const defaultPageOptions = computed<TreeSelectOption[]>(() => buildDefaultPageOptions(defaultPages.value));
// 数据权限类型选项与后端 DataPermissionType 枚举写死对应：
// 选项 value 直接使用帕斯卡枚举值，表单提交无需转换；
// 小驼峰仅作为 i18n 消息键，文案维护在 locales/{语言}/users.ts 的 dataPermissionTypes 分组。
const dataPermissionTypeApiValues = new Map<string, DataPermissionType>([
  ["all", "All"],
  ["organization", "Organization"],
  ["organizationAndDescendants", "OrganizationAndDescendants"],
  ["self", "Self"],
]);
const dataPermissionTypeItemValues = new Map<DataPermissionType, string>(
  [...dataPermissionTypeApiValues].map(([itemValue, apiValue]) => [apiValue, itemValue] as const)
);
// 缺少翻译时回退显示传入的原始值，避免把消息键暴露给用户
function dataPermissionTypeLabel(itemValue: string): string {
  const messageKey = `users.dataPermissionTypes.${itemValue}`;
  return te(messageKey) ? t(messageKey) : itemValue;
}
// computed 保证切换语言时选项文案随之刷新
const dataPermissionTypeOptions = computed(() =>
  [...dataPermissionTypeApiValues].map(([itemValue, apiValue]) => ({
    label: dataPermissionTypeLabel(itemValue),
    value: apiValue,
  }))
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
  dataPermissionType: {
    required: true,
    type: "string",
    message: t("users.validation.dataPermissionType"),
    trigger: ["change", "blur"],
  },
}));

function buildOrganizationOptions(items: OrganizationListOutput[]): TreeSelectOption[] {
  const enabledItems = items.filter(item => item.enable);
  const childrenByParent = new Map<string, OrganizationListOutput[]>();
  enabledItems.forEach(item => {
    if (!item.parentId) return;
    const children = childrenByParent.get(item.parentId) ?? [];
    children.push(item);
    childrenByParent.set(item.parentId, children);
  });
  const enabledIds = new Set(enabledItems.map(item => item.id));
  const roots = enabledItems.filter(item => !item.parentId || !enabledIds.has(item.parentId));
  const buildOptions = (nodes: OrganizationListOutput[]): TreeSelectOption[] =>
    [...nodes]
      .sort((left, right) => left.sortOrder - right.sortOrder || left.id.localeCompare(right.id))
      .map(node => {
        const children = buildOptions(childrenByParent.get(node.id) ?? []);
        return {
          label: `${node.name} (${node.code})`,
          key: node.id,
          children: children.length ? children : undefined,
        };
      });
  return buildOptions(roots);
}
function buildDefaultPageOptions(items: DefaultPageOptionOutput[]): TreeSelectOption[] {
  return [...items]
    .sort((left, right) => left.sortOrder - right.sortOrder || left.id.localeCompare(right.id))
    .map(item => ({ label: item.title, key: item.id }));
}
// 列设置范围：可配置列为 username/actions 之外的 5 列；固定列（username 最左、actions 最右）不参与配置，
// 避免用户调整固定列导致布局错乱，也避免 actions 列与权限逻辑耦合。
const configurableColumnKeys = ["displayName", "phone", "email", "dataPermissionType", "enable"] as const;

// username 列固定最左，不参与列设置。
const usernameColumn = computed<DataTableColumn<UserListOutput>>(() => ({
  title: t("users.columns.username"),
  key: "username",
  minWidth: 160,
  fixed: "left",
}));

// 可配置列定义（key → 列定义）；computed 保证语言切换后标题响应式更新。
const configurableColumnMap = computed<Record<string, DataTableColumn<UserListOutput>>>(() => ({
  displayName: { title: t("users.columns.displayName"), key: "displayName", minWidth: 160 },
  phone: { title: t("users.columns.phone"), key: "phone", minWidth: 170 },
  email: {
    title: t("users.columns.email"),
    key: "email",
    minWidth: 230,
    render: row => h(NEllipsis, { tooltip: true }, { default: () => row.email }),
  },
  dataPermissionType: {
    title: t("users.columns.dataPermissionType"),
    key: "dataPermissionType",
    minWidth: 190,
    render: row =>
      dataPermissionTypeLabel(dataPermissionTypeItemValues.get(row.dataPermissionType) ?? row.dataPermissionType),
  },
  enable: {
    title: t("users.columns.status"),
    key: "enable",
    minWidth: 110,
    render: row =>
      canUpdate.value
        ? h(NSwitch, {
            value: row.enable,
            disabled: row.username === SystemUsername.SuperAdmin || actionLoading.value,
            loading: enablingIds.value.has(row.id),
            "onUpdate:value": value => changeEnable(row, value),
          })
        : h(
            NTag,
            { type: row.enable ? "success" : "error", bordered: false },
            { default: () => t(row.enable ? "users.statuses.enabled" : "users.statuses.disabled") }
          ),
  },
}));

// 列设置状态（顺序 + 显隐），localStorage 持久化，storage key 按页面唯一。
const { orderedKeys, hiddenKeys, visibleKeys, toggleColumn, moveColumn, resetColumns } = useColumnSettings({
  storageKey: "columnSettings.usersList",
  defaultOrder: [...configurableColumnKeys],
});

// 列设置面板展示项：全量可配置列（默认顺序），组件内部按 orderedKeys 排序展示。
const columnSettingItems = computed(() =>
  configurableColumnKeys.map(key => ({ key, title: t(`users.columns.${key === "enable" ? "status" : key}`) }))
);

// actions 列固定最右且按权限动态追加，不参与列设置。
const actionsColumn = computed<DataTableColumn<UserListOutput>>(() => ({
  title: t("users.columns.actions"),
  key: "actions",
  minWidth: 330,
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
                disabled: row.username === SystemUsername.SuperAdmin || actionLoading.value,
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
                disabled: row.username === SystemUsername.SuperAdmin || actionLoading.value,
                onClick: () => openDelete(row),
              },
              { default: () => t("users.actions.delete") }
            )
          : null,
        canAuthorize.value
          ? h(
              NButton,
              {
                text: true,
                type: "primary",
                disabled: actionLoading.value,
                onClick: () => openAuthorization(row),
              },
              { default: () => t("users.actions.authorize") }
            )
          : null,
        canResetPassword.value
          ? h(
              NButton,
              {
                text: true,
                type: "warning",
                disabled: row.username === SystemUsername.SuperAdmin || resettingPassword.value || actionLoading.value,
                onClick: () => openResetPassword(row),
              },
              { default: () => t("users.actions.resetPassword") }
            )
          : null,
      ],
    }),
}));

const columns = computed<DataTableColumns<UserListOutput>>(() => {
  const result: DataTableColumns<UserListOutput> = [usernameColumn.value];
  for (const key of visibleKeys.value) {
    result.push(configurableColumnMap.value[key]);
  }
  if (hasActions.value) {
    result.push(actionsColumn.value);
  }
  return result;
});

// 横向滚动宽度随可见列动态计算：固定列与可见列的 minWidth 之和，避免列显隐后滚动宽度失配。
const scrollX = computed(() => {
  let width = 160; // username 列
  for (const key of visibleKeys.value) {
    const minWidth = configurableColumnMap.value[key].minWidth;
    if (typeof minWidth === "number") width += minWidth;
  }
  return hasActions.value ? width + 330 : width;
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
    dataPermissionType: "Self",
    defaultPageId: null,
    enable: true,
  };
}
function openCreate() {
  if (actionLoading.value) return;
  editRequestSequence++;
  editingLoadingId.value = null;
  Object.assign(formModel, emptyForm());
  showEditor.value = true;
}
async function openEdit(user: UserListOutput) {
  if (actionLoading.value) return;
  const requestSequence = ++editRequestSequence;
  showEditor.value = false;
  editingLoadingId.value = user.id;
  const loadingMessage = window.$message.loading(t("common.loading"), { duration: 0 });
  try {
    const detail = await getUserDetail(user.id);
    if (!detail || requestSequence !== editRequestSequence) return;
    Object.assign(formModel, { ...detail, password: "" });
    showEditor.value = true;
  } catch {
    // 错误由统一请求处理展示，详情失败时保持编辑弹窗关闭。
  } finally {
    loadingMessage.destroy();
    if (requestSequence === editRequestSequence) editingLoadingId.value = null;
  }
}
function openDelete(user: UserListOutput) {
  if (actionLoading.value) return;
  deletingUser.value = user;
  showDeleteConfirm.value = true;
}
function openResetPassword(user: UserListOutput) {
  if (actionLoading.value) return;
  resettingUser.value = user;
  showResetPasswordConfirm.value = true;
}
async function confirmResetPassword() {
  if (!resettingUser.value || resettingPassword.value) return;
  resettingPassword.value = true;
  try {
    const result = await resetUserPassword(resettingUser.value.id, resettingUser.value.version);
    if (!result) return;
    resetPasswordResult.value = result.password;
    showResetPasswordConfirm.value = false;
    resettingUser.value = null;
    showResetPasswordResult.value = true;
    window.$message.success(t("users.messages.passwordReset"));
  } finally {
    resettingPassword.value = false;
  }
}
async function copyResetPassword() {
  try {
    await navigator.clipboard.writeText(resetPasswordResult.value);
    window.$message.success(t("users.messages.passwordCopied"));
  } catch {
    window.$message.error(t("users.messages.passwordCopyFailed"));
  }
}
async function openAuthorization(user: UserListOutput) {
  if (actionLoading.value) return;
  authorizingUser.value = user;
  authorizationOptions.value = [];
  authorizationCheckedKeys.value = [];
  authorizationIndeterminateKeys.value = [];
  authorizationSelectedIds.value = new Set();
  authorizationLoading.value = true;
  const loadingMessage = window.$message.loading(t("common.loading"), { duration: 0 });
  try {
    const data = await getUserAuthorization(user.id);
    if (!data) {
      showAuthorization.value = false;
      authorizingUser.value = null;
      return;
    }
    authorizationPermissions.value = data.permissions;
    authorizationOptions.value = buildPermissionOptions(data.permissions);
    authorizationSelectedIds.value = new Set(data.permissionIds);
    syncAuthorizationTreeState();
    showAuthorization.value = true;
  } catch {
    showAuthorization.value = false;
    authorizingUser.value = null;
  } finally {
    loadingMessage.destroy();
    authorizationLoading.value = false;
  }
}
function buildPermissionOptions(items: PermissionListOutput[]): TreeOption[] {
  const byParent = new Map<string, PermissionListOutput[]>();
  items.forEach(item => {
    if (!item.parentId) return;
    const children = byParent.get(item.parentId) ?? [];
    children.push(item);
    byParent.set(item.parentId, children);
  });
  const ids = new Set(items.map(item => item.id));
  const roots = items.filter(item => !item.parentId || !ids.has(item.parentId));
  const build = (nodes: PermissionListOutput[], ancestorDisabled = false): TreeOption[] =>
    [...nodes]
      .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id))
      .map(item => {
        const disabled = ancestorDisabled || !item.enable;
        const children = build(byParent.get(item.id) ?? [], disabled);
        return {
          key: item.id,
          label: `${item.title} (${item.code})`,
          disabled,
          children: children.length ? children : undefined,
        };
      });
  return build(roots);
}
function handleAuthorizationCheck(
  _keys: Array<string | number>,
  _options: Array<TreeOption | null>,
  meta: { node: TreeOption | null; action: "check" | "uncheck" }
) {
  if (meta.node?.key === undefined) return;
  const selected = new Set(authorizationSelectedIds.value);
  const byId = new Map(authorizationPermissions.value.map(permission => [permission.id, permission]));
  const updateSubtree = (option: TreeOption, checked: boolean) => {
    if (option.disabled || option.key === undefined) return;
    const id = String(option.key);
    checked ? selected.add(id) : selected.delete(id);
    option.children?.forEach(child => updateSubtree(child, checked));
  };
  const nodeId = String(meta.node.key);
  updateSubtree(meta.node, meta.action === "check");
  if (meta.action === "uncheck") {
    for (let parentId = byId.get(nodeId)?.parentId; parentId; parentId = byId.get(parentId)?.parentId ?? null) {
      selected.delete(parentId);
    }
  }
  [...selected].forEach(id => {
    for (let parentId = byId.get(id)?.parentId; parentId; parentId = byId.get(parentId)?.parentId ?? null)
      selected.add(parentId);
  });
  authorizationSelectedIds.value = selected;
  syncAuthorizationTreeState();
}
function syncAuthorizationTreeState() {
  const checkedKeys: Array<string | number> = [];
  const indeterminateKeys: Array<string | number> = [];
  const visit = (option: TreeOption): { editable: number; selected: number } => {
    let editableDescendants = 0;
    let selectedDescendants = 0;
    option.children?.forEach(child => {
      const status = visit(child);
      editableDescendants += status.editable;
      selectedDescendants += status.selected;
    });
    if (option.key === undefined) return { editable: editableDescendants, selected: selectedDescendants };
    const selected = authorizationSelectedIds.value.has(String(option.key));
    if (option.disabled) {
      if (selected) checkedKeys.push(option.key);
      return { editable: 0, selected: 0 };
    }
    if (
      editableDescendants > 0 &&
      (selected || selectedDescendants > 0) &&
      (!selected || selectedDescendants < editableDescendants)
    )
      indeterminateKeys.push(option.key);
    else if (selected) checkedKeys.push(option.key);
    return {
      editable: editableDescendants + 1,
      selected: selectedDescendants + (selected ? 1 : 0),
    };
  };
  authorizationOptions.value.forEach(visit);
  authorizationCheckedKeys.value = checkedKeys;
  authorizationIndeterminateKeys.value = indeterminateKeys;
}
async function saveAuthorization() {
  if (!authorizingUser.value) return;
  authorizationSaving.value = true;
  try {
    const selected = new Set(authorizationSelectedIds.value);
    const byId = new Map(authorizationPermissions.value.map(permission => [permission.id, permission]));
    [...selected].forEach(id => {
      for (let parentId = byId.get(id)?.parentId; parentId; parentId = byId.get(parentId)?.parentId ?? null)
        selected.add(parentId);
    });
    await authorizeUser(authorizingUser.value.id, [...selected]);
    window.$message.success(t("users.messages.authorized"));
    showAuthorization.value = false;
    authorizingUser.value = null;
  } finally {
    authorizationSaving.value = false;
  }
}
async function submitEditor() {
  // submitting 在校验前同步置位：校验是异步过程，置位晚于校验会导致双击绕过按钮 loading 重复提交。
  if (submitting.value) return;
  submitting.value = true;
  try {
    await formRef.value?.validate();
    if (!formModel.orgId) return;
    if (formModel.id && formModel.version) {
      await updateUser({
        id: formModel.id,
        version: formModel.version,
        displayName: formModel.displayName,
        phone: formModel.phone,
        email: formModel.email,
        orgId: formModel.orgId,
        defaultPageId: formModel.defaultPageId,
        dataPermissionType: formModel.dataPermissionType,
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
        defaultPageId: formModel.defaultPageId,
        dataPermissionType: formModel.dataPermissionType,
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
  if (actionLoading.value) return;
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
  if (!deletingUser.value || deleting.value) return;
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
  pagination.disabled = true;
  try {
    const result = await getUserList({
      index: pagination.page ?? 1,
      limit: pagination.pageSize ?? 20,
      keyword: appliedKeyword.value || undefined,
      enable: appliedStatus.value === null ? undefined : appliedStatus.value === "enabled",
    });
    users.value = result?.list ?? [];
    pagination.itemCount = result?.total ?? 0;
    const lastPage = Math.max(1, Math.ceil((pagination.itemCount ?? 0) / (pagination.pageSize ?? 20)));
    if ((pagination.page ?? 1) > lastPage) {
      pagination.page = lastPage;
      await loadUsers();
    }
  } finally {
    loading.value = false;
    pagination.disabled = false;
  }
}
function searchUsers() {
  if (actionLoading.value) return;
  appliedKeyword.value = keyword.value.trim();
  appliedStatus.value = statusFilter.value;
  pagination.page = 1;
  void loadUsers();
}
function resetFilters() {
  if (actionLoading.value) return;
  keyword.value = "";
  statusFilter.value = null;
  appliedKeyword.value = "";
  appliedStatus.value = null;
  pagination.page = 1;
  void loadUsers();
}
// 刷新：保持当前页码与已应用的筛选条件，仅重新拉取列表数据。
function refreshUsers() {
  if (actionLoading.value) return;
  void loadUsers();
}
async function loadOrganizations() {
  organizationsLoading.value = true;
  try {
    organizations.value = (await getUserOrganizationOptions()) ?? [];
  } finally {
    organizationsLoading.value = false;
  }
}
async function loadDefaultPages() {
  defaultPagesLoading.value = true;
  try {
    defaultPages.value = (await getDefaultPageOptions()) ?? [];
  } finally {
    defaultPagesLoading.value = false;
  }
}
onMounted(async () => {
  await permissionsStore.getPermissions();
  // 选项加载封装为子任务并在内部 await，外层不直接依赖其完成时机，与 loadUsers 并行执行
  const loadEditorOptions = async () => {
    if (!canCreate.value && !canUpdate.value) return;
    await Promise.all([loadOrganizations(), loadDefaultPages()]);
  };
  await Promise.all([loadUsers(), loadEditorOptions()]);
});
</script>

<style lang="scss" scoped>
.user-list-page {
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex: 1 1 auto;

  > :deep(.n-card) {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    flex: 1 1 0;
    min-width: 0;

    .n-card-content {
      display: flex;
      flex-direction: column;
      flex: 1 1 0;
      overflow: hidden;

      .toolbar {
        flex: 0 0 auto;
      }
    }
  }
}
.toolbar {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;

  // 按钮列内的排布；列定位与响应式由 n-grid 承担。
  .filter-actions {
    display: flex;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 12px;
  }

  // 分割线颜色取卡片主题边框色，跟随明暗主题；上方 16px 由 toolbar 的 gap 提供。
  .action-bar {
    border-top: 1px solid var(--n-border-color);
    padding-top: 16px;
  }
}
.reset-password-value {
  margin-top: 16px;
}
</style>
