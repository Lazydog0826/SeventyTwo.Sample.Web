// noinspection JSUnusedGlobalSymbols
export default {
  title: "机构列表",
  filters: { keyword: "搜索机构名称或编码", status: "机构状态" },
  columns: { name: "机构名称", code: "机构编码", sortOrder: "排序", status: "状态", actions: "操作" },
  statuses: { enabled: "启用", disabled: "禁用" },
  actions: {
    create: "新增机构",
    edit: "编辑",
    delete: "删除",
    cancel: "取消",
    save: "保存",
    refresh: "刷新",
    settings: "设置",
  },
  editor: { createTitle: "新增机构", updateTitle: "编辑机构" },
  form: { code: "机构编码", name: "机构名称", sortOrder: "排序", parent: "上级机构", enable: "启用" },
  placeholders: {
    code: "请输入机构编码",
    name: "请输入机构名称",
    sortOrder: "请输入排序号",
    parent: "请选择上级机构；留空创建根机构",
  },
  validation: { code: "请输入机构编码", name: "请输入机构名称", sortOrder: "排序号必须为非负整数" },
  delete: { title: "删除机构", content: "确定永久删除机构“{name}”吗？此操作不可恢复。" },
  messages: { created: "机构新增成功", updated: "机构修改成功", deleted: "机构删除成功" },
  empty: { data: "暂无机构数据", filtered: "没有符合筛选条件的机构" },
};
