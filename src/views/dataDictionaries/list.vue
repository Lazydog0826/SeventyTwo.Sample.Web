<!--suppress ExceptionCaughtLocallyJS -->
<template>
  <div class="data-dictionary-page">
    <n-grid responsive="self" cols="1 900:2" :x-gap="16" :y-gap="16">
      <n-grid-item>
        <n-card :bordered="false" :title="t('dataDictionaries.dictionaryTitle')">
          <div class="toolbar">
            <n-space :wrap="true">
              <n-input
                v-model:value="keyword"
                clearable
                :placeholder="t('dataDictionaries.filters.keyword')"
                class="keyword-input"
              />
              <n-select
                v-model:value="statusFilter"
                clearable
                :placeholder="t('dataDictionaries.filters.status')"
                :options="statusOptions"
                class="status-select"
              />
            </n-space>
            <n-button v-if="canCreate" type="primary" @click="openCreateDictionary">
              {{ t("dataDictionaries.actions.create") }}
            </n-button>
          </div>
          <n-data-table
            :columns="dictionaryColumns"
            :data="filteredDictionaries"
            :loading="dictionaryLoading"
            :row-key="(row: DataDictionaryListOutput) => row.id"
            :row-props="dictionaryRowProps"
            :scroll-x="900"
            :single-line="false"
            striped
          >
            <template #empty><n-empty :description="dictionaryEmptyDescription" /></template>
          </n-data-table>
        </n-card>
      </n-grid-item>

      <n-grid-item>
        <n-card :bordered="false" :title="itemCardTitle">
          <template #header-extra>
            <n-button v-if="selectedDictionary && canUpdate" type="primary" @click="openCreateItem">
              {{ t("dataDictionaries.actions.createItem") }}
            </n-button>
          </template>
          <n-data-table
            v-if="selectedDictionary"
            :columns="itemColumns"
            :data="items"
            :loading="itemLoading"
            :row-key="(row: DataDictionaryItemOutput) => row.id"
            :scroll-x="600"
            :single-line="false"
            striped
          >
            <template #empty><n-empty :description="t('dataDictionaries.empty.items')" /></template>
          </n-data-table>
          <n-empty v-else :description="t('dataDictionaries.empty.select')" />
        </n-card>
      </n-grid-item>
    </n-grid>

    <n-modal
      v-model:show="showDictionaryEditor"
      preset="card"
      :title="dictionaryEditorTitle"
      style="width: 560px; max-width: calc(100vw - 32px)"
    >
      <n-form
        ref="dictionaryFormRef"
        :model="dictionaryForm"
        :rules="dictionaryRules"
        label-placement="left"
        label-width="auto"
      >
        <n-form-item :label="t('dataDictionaries.form.code')" path="code">
          <n-input v-model:value="dictionaryForm.code" :placeholder="t('dataDictionaries.placeholders.code')" />
        </n-form-item>
        <n-form-item :label="t('dataDictionaries.form.name')" path="name">
          <n-input v-model:value="dictionaryForm.name" :placeholder="t('dataDictionaries.placeholders.name')" />
        </n-form-item>
        <n-form-item :label="t('dataDictionaries.form.description')" path="description">
          <n-input
            v-model:value="dictionaryForm.description"
            type="textarea"
            :placeholder="t('dataDictionaries.placeholders.description')"
          />
        </n-form-item>
        <n-form-item :label="t('dataDictionaries.form.enable')" path="enable">
          <n-switch v-model:value="dictionaryForm.enable" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showDictionaryEditor = false">{{ t("dataDictionaries.actions.cancel") }}</n-button>
          <n-button type="primary" :loading="submitting" @click="submitDictionary">{{
            t("dataDictionaries.actions.save")
          }}</n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal
      v-model:show="showItemEditor"
      preset="card"
      :title="itemEditorTitle"
      style="width: 560px; max-width: calc(100vw - 32px)"
    >
      <n-form ref="itemFormRef" :model="itemForm" :rules="itemRules" label-placement="left" label-width="auto">
        <n-form-item :label="t('dataDictionaries.form.value')" path="value">
          <n-input v-model:value="itemForm.value" :placeholder="t('dataDictionaries.placeholders.value')" />
        </n-form-item>
        <n-form-item :label="t('dataDictionaries.form.label')" path="label">
          <n-input v-model:value="itemForm.label" :placeholder="t('dataDictionaries.placeholders.label')" />
        </n-form-item>
        <n-form-item :label="t('dataDictionaries.form.sortOrder')" path="sortOrder">
          <n-input-number v-model:value="itemForm.sortOrder" :min="0" :precision="0" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showItemEditor = false">{{ t("dataDictionaries.actions.cancel") }}</n-button>
          <n-button type="primary" :loading="submitting" @click="submitItem">{{
            t("dataDictionaries.actions.save")
          }}</n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal
      v-model:show="showDictionaryDelete"
      preset="dialog"
      type="warning"
      :title="t('dataDictionaries.delete.dictionaryTitle')"
    >
      {{ t("dataDictionaries.delete.dictionaryContent", { name: deletingDictionary?.name ?? "" }) }}
      <template #action>
        <n-space justify="end">
          <n-button @click="showDictionaryDelete = false">{{ t("dataDictionaries.actions.cancel") }}</n-button>
          <n-button type="error" :loading="deleting" @click="confirmDeleteDictionary">{{
            t("dataDictionaries.actions.delete")
          }}</n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal
      v-model:show="showItemDelete"
      preset="dialog"
      type="warning"
      :title="t('dataDictionaries.delete.itemTitle')"
    >
      {{ t("dataDictionaries.delete.itemContent", { label: deletingItem?.label ?? "" }) }}
      <template #action>
        <n-space justify="end">
          <n-button @click="showItemDelete = false">{{ t("dataDictionaries.actions.cancel") }}</n-button>
          <n-button type="error" :loading="deleting" @click="confirmDeleteItem">{{
            t("dataDictionaries.actions.delete")
          }}</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, h, onMounted, reactive, ref } from "vue";
import { HTTPError } from "ky";
import {
  NButton,
  NCard,
  NDataTable,
  NEllipsis,
  NEmpty,
  NForm,
  NFormItem,
  NGrid,
  NGridItem,
  NInput,
  NInputNumber,
  NModal,
  NRadio,
  NSelect,
  NSpace,
  NSwitch,
  NTag,
  type DataTableColumns,
  type FormInst,
  type FormRules,
} from "naive-ui";
import {
  createDataDictionary,
  createDataDictionaryItem,
  deleteDataDictionary,
  deleteDataDictionaryItem,
  getDataDictionaryItems,
  getDataDictionaryList,
  updateDataDictionary,
  updateDataDictionaryItem,
  type DataDictionaryItemOutput,
  type DataDictionaryListOutput,
  type DataDictionaryMutationInput,
} from "@/api/dataDictionaries.ts";
import { PermissionCode } from "@/constants/permissions.ts";
import { usePermissionsStore } from "@/stores/permissions.ts";
import { useI18n } from "vue-i18n";

interface DictionaryFormModel extends DataDictionaryMutationInput {
  id: string | null;
  version: string | null;
}
interface ItemFormModel {
  id: string | null;
  value: string;
  label: string;
  sortOrder: number | null;
}
type StatusFilter = "enabled" | "disabled";

const { t } = useI18n();
const permissionsStore = usePermissionsStore();
const dictionaries = ref<DataDictionaryListOutput[]>([]);
const items = ref<DataDictionaryItemOutput[]>([]);
const selectedDictionaryId = ref<string | null>(null);
const keyword = ref("");
const statusFilter = ref<StatusFilter | null>(null);
const dictionaryLoading = ref(false);
const itemLoading = ref(false);
const submitting = ref(false);
const deleting = ref(false);
const showDictionaryEditor = ref(false);
const showItemEditor = ref(false);
const showDictionaryDelete = ref(false);
const showItemDelete = ref(false);
const deletingDictionary = ref<DataDictionaryListOutput | null>(null);
const deletingItem = ref<DataDictionaryItemOutput | null>(null);
const dictionaryFormRef = ref<FormInst | null>(null);
const itemFormRef = ref<FormInst | null>(null);
const dictionaryForm = reactive<DictionaryFormModel>(emptyDictionaryForm());
const itemForm = reactive<ItemFormModel>(emptyItemForm());

const canCreate = computed(() => permissionsStore.hasPermission(PermissionCode.DataDictionariesCreate));
const canUpdate = computed(() => permissionsStore.hasPermission(PermissionCode.DataDictionariesUpdate));
const canDelete = computed(() => permissionsStore.hasPermission(PermissionCode.DataDictionariesDelete));
const selectedDictionary = computed(
  () => dictionaries.value.find(item => item.id === selectedDictionaryId.value) ?? null
);
const statusOptions = computed(() => [
  { label: t("dataDictionaries.statuses.enabled"), value: "enabled" },
  { label: t("dataDictionaries.statuses.disabled"), value: "disabled" },
]);
const filteredDictionaries = computed(() => {
  const normalized = keyword.value.trim().toLocaleLowerCase();
  return dictionaries.value.filter(item => {
    const matchesKeyword =
      !normalized ||
      item.code.toLocaleLowerCase().includes(normalized) ||
      item.name.toLocaleLowerCase().includes(normalized);
    const matchesStatus =
      statusFilter.value === null || (statusFilter.value === "enabled" ? item.enable : !item.enable);
    return matchesKeyword && matchesStatus;
  });
});
const dictionaryEmptyDescription = computed(() =>
  t(
    keyword.value.trim() || statusFilter.value
      ? "dataDictionaries.empty.filtered"
      : "dataDictionaries.empty.dictionaries"
  )
);
const itemCardTitle = computed(() =>
  selectedDictionary.value
    ? `${t("dataDictionaries.itemTitle")} · ${selectedDictionary.value.name}`
    : t("dataDictionaries.itemTitle")
);
const dictionaryEditorTitle = computed(() =>
  t(dictionaryForm.id ? "dataDictionaries.editor.updateTitle" : "dataDictionaries.editor.createTitle")
);
const itemEditorTitle = computed(() =>
  t(itemForm.id ? "dataDictionaries.editor.updateItemTitle" : "dataDictionaries.editor.createItemTitle")
);
const dictionaryRules = computed<FormRules>(() => ({
  code: {
    required: true,
    whitespace: true,
    message: t("dataDictionaries.validation.code"),
    trigger: ["input", "blur"],
  },
  name: {
    required: true,
    whitespace: true,
    message: t("dataDictionaries.validation.name"),
    trigger: ["input", "blur"],
  },
}));
const itemRules = computed<FormRules>(() => ({
  value: {
    required: true,
    whitespace: true,
    message: t("dataDictionaries.validation.value"),
    trigger: ["input", "blur"],
  },
  label: {
    required: true,
    whitespace: true,
    message: t("dataDictionaries.validation.label"),
    trigger: ["input", "blur"],
  },
  sortOrder: [
    {
      required: true,
      type: "number",
      message: t("dataDictionaries.validation.sortOrderRequired"),
      trigger: ["input", "blur"],
    },
    {
      type: "number",
      min: 0,
      message: t("dataDictionaries.validation.sortOrder"),
      trigger: ["input", "blur"],
    },
  ],
}));

const dictionaryColumns = computed<DataTableColumns<DataDictionaryListOutput>>(() => {
  const columns: DataTableColumns<DataDictionaryListOutput> = [
    {
      key: "selection",
      width: 48,
      fixed: "left",
      render: row =>
        h(NRadio, {
          checked: row.id === selectedDictionaryId.value,
          "aria-label": row.name,
          onClick: (event: MouseEvent) => event.stopPropagation(),
          onUpdateChecked: checked => {
            if (checked) void selectDictionary(row.id);
          },
        }),
    },
    { title: t("dataDictionaries.columns.code"), key: "code", width: 160, render: row => textCell(row.code, 140) },
    { title: t("dataDictionaries.columns.name"), key: "name", width: 160, render: row => textCell(row.name, 140) },
    {
      title: t("dataDictionaries.columns.description"),
      key: "description",
      width: 200,
      render: row => textCell(row.description ?? "-", 180),
    },
    { title: t("dataDictionaries.columns.itemCount"), key: "itemCount", width: 90 },
    {
      title: t("dataDictionaries.columns.status"),
      key: "enable",
      width: 90,
      render: row =>
        h(
          NTag,
          { type: row.enable ? "success" : "error", bordered: false },
          { default: () => t(row.enable ? "dataDictionaries.statuses.enabled" : "dataDictionaries.statuses.disabled") }
        ),
    },
  ];
  if (canUpdate.value || canDelete.value)
    columns.push({
      title: t("dataDictionaries.columns.actions"),
      key: "actions",
      width: 130,
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
                    onClick: (event: MouseEvent) => {
                      event.stopPropagation();
                      openEditDictionary(row);
                    },
                  },
                  { default: () => t("dataDictionaries.actions.edit") }
                )
              : null,
            canDelete.value
              ? h(
                  NButton,
                  {
                    text: true,
                    type: "error",
                    onClick: (event: MouseEvent) => {
                      event.stopPropagation();
                      openDeleteDictionary(row);
                    },
                  },
                  { default: () => t("dataDictionaries.actions.delete") }
                )
              : null,
          ],
        }),
    });
  return columns;
});

const itemColumns = computed<DataTableColumns<DataDictionaryItemOutput>>(() => {
  const columns: DataTableColumns<DataDictionaryItemOutput> = [
    { title: t("dataDictionaries.columns.value"), key: "value", width: 180, render: row => textCell(row.value, 160) },
    { title: t("dataDictionaries.columns.label"), key: "label", width: 200, render: row => textCell(row.label, 180) },
    { title: t("dataDictionaries.columns.sortOrder"), key: "sortOrder", width: 90 },
  ];
  if (canUpdate.value)
    columns.push({
      title: t("dataDictionaries.columns.actions"),
      key: "actions",
      width: 130,
      render: row =>
        h(NSpace, null, {
          default: () => [
            h(
              NButton,
              { text: true, type: "primary", onClick: () => openEditItem(row) },
              { default: () => t("dataDictionaries.actions.edit") }
            ),
            h(
              NButton,
              { text: true, type: "error", onClick: () => openDeleteItem(row) },
              { default: () => t("dataDictionaries.actions.delete") }
            ),
          ],
        }),
    });
  return columns;
});

function emptyDictionaryForm(): DictionaryFormModel {
  return { id: null, version: null, code: "", name: "", description: null, enable: true };
}
function emptyItemForm(): ItemFormModel {
  return { id: null, value: "", label: "", sortOrder: 0 };
}
function textCell(value: string, maxWidth: number) {
  return h(NEllipsis, { tooltip: true, style: { maxWidth: `${maxWidth}px` } }, { default: () => value });
}
function dictionaryRowProps(row: DataDictionaryListOutput) {
  return {
    class: row.id === selectedDictionaryId.value ? "selected-row" : "",
    onClick: () => selectDictionary(row.id),
  };
}

async function selectDictionary(id: string) {
  if (selectedDictionaryId.value === id && items.value.length) return;
  if (selectedDictionaryId.value !== id) items.value = [];
  selectedDictionaryId.value = id;
  await loadItems();
}

function openCreateDictionary() {
  Object.assign(dictionaryForm, emptyDictionaryForm());
  showDictionaryEditor.value = true;
}
function openEditDictionary(row: DataDictionaryListOutput) {
  Object.assign(dictionaryForm, row);
  showDictionaryEditor.value = true;
}
function openDeleteDictionary(row: DataDictionaryListOutput) {
  deletingDictionary.value = row;
  showDictionaryDelete.value = true;
}
function openCreateItem() {
  Object.assign(itemForm, emptyItemForm());
  showItemEditor.value = true;
}
function openEditItem(row: DataDictionaryItemOutput) {
  Object.assign(itemForm, row);
  showItemEditor.value = true;
}
function openDeleteItem(row: DataDictionaryItemOutput) {
  deletingItem.value = row;
  showItemDelete.value = true;
}

async function submitDictionary() {
  await dictionaryFormRef.value?.validate();
  submitting.value = true;
  try {
    const input: DataDictionaryMutationInput = {
      code: dictionaryForm.code,
      name: dictionaryForm.name,
      description: dictionaryForm.description,
      enable: dictionaryForm.enable,
    };
    if (dictionaryForm.id && dictionaryForm.version) {
      await updateDataDictionary({ ...input, id: dictionaryForm.id, version: dictionaryForm.version });
      window.$message.success(t("dataDictionaries.messages.updated"));
    } else {
      const created = await createDataDictionary(input);
      if (!created) throw new Error("Data dictionary create response is empty");
      selectedDictionaryId.value = created.id;
      window.$message.success(t("dataDictionaries.messages.created"));
    }
    showDictionaryEditor.value = false;
    await loadDictionaries();
  } catch (error) {
    await reloadOnConflict(error);
    throw error;
  } finally {
    submitting.value = false;
  }
}

async function submitItem() {
  await itemFormRef.value?.validate();
  if (!selectedDictionary.value || itemForm.sortOrder === null) return;
  submitting.value = true;
  try {
    const input = {
      dictionaryId: selectedDictionary.value.id,
      value: itemForm.value,
      label: itemForm.label,
      sortOrder: itemForm.sortOrder,
      dictionaryVersion: selectedDictionary.value.version,
    };
    const result = itemForm.id
      ? await updateDataDictionaryItem({ ...input, id: itemForm.id })
      : await createDataDictionaryItem(input);
    if (!result) throw new Error("Data dictionary item mutation response is empty");
    applyDictionaryVersion(result.dictionaryVersion);
    window.$message.success(
      t(itemForm.id ? "dataDictionaries.messages.itemUpdated" : "dataDictionaries.messages.itemCreated")
    );
    showItemEditor.value = false;
    await loadItems();
  } catch (error) {
    await reloadOnConflict(error);
    throw error;
  } finally {
    submitting.value = false;
  }
}

async function confirmDeleteDictionary() {
  if (!deletingDictionary.value) return;
  deleting.value = true;
  try {
    await deleteDataDictionary(deletingDictionary.value.id);
    if (selectedDictionaryId.value === deletingDictionary.value.id) {
      selectedDictionaryId.value = null;
      items.value = [];
    }
    showDictionaryDelete.value = false;
    deletingDictionary.value = null;
    window.$message.success(t("dataDictionaries.messages.deleted"));
    await loadDictionaries();
  } finally {
    deleting.value = false;
  }
}

async function confirmDeleteItem() {
  if (!selectedDictionary.value || !deletingItem.value) return;
  deleting.value = true;
  try {
    const result = await deleteDataDictionaryItem({
      dictionaryId: selectedDictionary.value.id,
      id: deletingItem.value.id,
      dictionaryVersion: selectedDictionary.value.version,
    });
    if (!result) throw new Error("Data dictionary item delete response is empty");
    applyDictionaryVersion(result.dictionaryVersion);
    showItemDelete.value = false;
    deletingItem.value = null;
    window.$message.success(t("dataDictionaries.messages.itemDeleted"));
    await loadItems();
  } catch (error) {
    await reloadOnConflict(error);
    throw error;
  } finally {
    deleting.value = false;
  }
}

async function loadDictionaries() {
  dictionaryLoading.value = true;
  try {
    dictionaries.value = (await getDataDictionaryList()) ?? [];
    if (selectedDictionaryId.value && !dictionaries.value.some(item => item.id === selectedDictionaryId.value))
      selectedDictionaryId.value = null;
    if (!selectedDictionaryId.value && dictionaries.value.length) selectedDictionaryId.value = dictionaries.value[0].id;
    if (selectedDictionaryId.value) await loadItems();
  } finally {
    dictionaryLoading.value = false;
  }
}

async function loadItems() {
  if (!selectedDictionaryId.value) {
    items.value = [];
    return;
  }
  const requestedId = selectedDictionaryId.value;
  itemLoading.value = true;
  try {
    const result = await getDataDictionaryItems(requestedId);
    if (!result) throw new Error("Data dictionary items response is empty");
    if (selectedDictionaryId.value !== requestedId) return;
    items.value = result.items ?? [];
    applyDictionaryVersion(result.version);
    const dictionary = dictionaries.value.find(item => item.id === requestedId);
    if (dictionary) dictionary.itemCount = items.value.length;
  } finally {
    itemLoading.value = false;
  }
}

function applyDictionaryVersion(version: string) {
  const dictionary = selectedDictionary.value;
  if (dictionary) dictionary.version = version;
}

async function reloadOnConflict(error: unknown) {
  if (!(error instanceof HTTPError) || error.response.status !== 409) return;

  const editingDictionaryId = dictionaryForm.id;
  const editingItemId = itemForm.id;
  const deletingItemId = deletingItem.value?.id ?? null;
  await loadDictionaries();

  if (showDictionaryEditor.value && editingDictionaryId) {
    const currentDictionary = dictionaries.value.find(item => item.id === editingDictionaryId);
    if (currentDictionary) Object.assign(dictionaryForm, currentDictionary);
    else showDictionaryEditor.value = false;
  }
  if (showItemEditor.value && editingItemId) {
    const currentItem = items.value.find(item => item.id === editingItemId);
    if (currentItem) Object.assign(itemForm, currentItem);
    else showItemEditor.value = false;
  }
  if (showItemDelete.value && deletingItemId) {
    deletingItem.value = items.value.find(item => item.id === deletingItemId) ?? null;
    if (!deletingItem.value) showItemDelete.value = false;
  }
}

onMounted(() => Promise.all([loadDictionaries(), permissionsStore.getPermissions()]));
</script>

<style scoped lang="scss">
.data-dictionary-page {
  min-width: 0;
}
.toolbar {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}
.keyword-input {
  width: 230px;
}
.status-select {
  width: 140px;
}
:deep(.n-data-table-tr) {
  cursor: pointer;
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
