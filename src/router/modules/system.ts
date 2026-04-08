const Layout = () => import("@/layout/index.vue");

export default {
  path: "/system",
  name: "System",
  component: Layout,
  redirect: "/system/role",
  meta: {
    icon: "ri:settings-3-line",
    title: "系统管理",
    rank: 10
  },
  children: [
    {
      path: "/system/role",
      name: "SystemRole",
      component: () => import("@/views/system/role/index.vue"),
      meta: {
        title: "角色管理",
        roles: ["admin"]
      }
    },
    {
      path: "/system/role/edit",
      name: "SystemRoleEdit",
      component: () => import("@/views/system/role/edit.vue"),
      meta: {
        title: "角色编辑",
        roles: ["admin"],
        showLink: false
      }
    },
    {
      path: "/system/member",
      name: "SystemMember",
      component: () => import("@/views/system/member/index.vue"),
      meta: {
        title: "成员管理",
        roles: ["admin"]
      }
    },
    {
      path: "/system/member/edit",
      name: "SystemMemberEdit",
      component: () => import("@/views/system/member/edit.vue"),
      meta: {
        title: "编辑成员",
        roles: ["admin"],
        showLink: false
      }
    }
  ]
} satisfies RouteConfigsTable;
