const Layout = () => import("@/layout/index.vue");

export default {
  path: "/tag",
  name: "Tag",
  component: Layout,
  redirect: "/tag/manage",
  meta: {
    icon: "ri:price-tag-3-line",
    title: "标签管理",
    rank: 12
  },
  children: [
    {
      path: "/tag/manage",
      name: "TagManage",
      component: () => import("@/views/tag/index.vue"),
      meta: {
        title: "标签列表",
        roles: ["admin"]
      }
    }
  ]
} satisfies RouteConfigsTable;
