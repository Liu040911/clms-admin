const Layout = () => import("@/layout/index.vue");

export default {
  path: "/lecture",
  name: "Lecture",
  component: Layout,
  redirect: "/lecture/manage",
  meta: {
    icon: "ri:presentation-line",
    title: "讲座管理",
    rank: 11
  },
  children: [
    {
      path: "/lecture/manage",
      name: "LectureManage",
      component: () => import("@/views/lecture/index.vue"),
      meta: {
        title: "讲座列表",
        roles: ["admin"]
      }
    }
  ]
} satisfies RouteConfigsTable;
