export default {
  title: "权限列表",
  filters: {
    keyword: "搜索权限标题或编码",
    type: "权限类型",
    status: "启用状态",
  },
  types: {
    directory: "目录",
    page: "页面",
    button: "按钮",
  },
  statuses: {
    enabled: "已启用",
    disabled: "已禁用",
  },
  columns: {
    title: "权限标题",
    code: "权限编码",
    type: "类型",
    status: "状态",
    sortOrder: "排序",
    icon: "图标",
    routePath: "路由路径",
    routeName: "路由名称",
    componentPath: "组件路径",
    metaData: "路由元数据",
  },
  metaData: {
    show: "显示",
    hide: "隐藏",
  },
  empty: {
    data: "暂无权限数据",
    filtered: "没有符合筛选条件的权限",
  },
};
