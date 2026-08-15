export default {
  title: "商品类目",
  filters: { keyword: "搜索类目名称" },
  columns: { name: "类目名称", path: "类目层级路径", actions: "操作" },
  actions: { create: "新增类目", edit: "编辑", delete: "删除", cancel: "取消", save: "保存" },
  editor: { createTitle: "新增类目", updateTitle: "编辑类目" },
  form: { name: "类目名称", parent: "上级类目" },
  placeholders: {
    name: "请输入类目名称",
    parent: "请选择上级类目；留空创建顶级类目",
  },
  validation: { name: "请输入类目名称" },
  delete: { title: "删除类目", content: "确定删除类目“{name}”吗？" },
  messages: { created: "类目新增成功", updated: "类目修改成功", deleted: "类目删除成功" },
  empty: { data: "暂无类目数据", filtered: "没有符合筛选条件的类目" },
};
