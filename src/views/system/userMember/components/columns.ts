import { ElMessageBox, ElMessage, ElTag } from "element-plus";
import { h, type ComputedRef } from "vue";
import {
  disableUserMember,
  enableUserMember,
  type UserMemberInfo
} from "@/api/userMember";
import type { TableColumns } from "@pureadmin/table";

export type MyTableColumns = TableColumns & {
  searchable?: boolean;
};

export type MyTableColumnList = MyTableColumns[];

export function useColumns(
  onStatusChange?: () => void,
  roleNameMap?: ComputedRef<Record<string, string>>
) {
  const columns: MyTableColumnList = [
    { type: "selection", align: "left" },
    {
      label: "昵称",
      prop: "nickname",
      searchable: true,
      sortable: true,
      minWidth: 120
    },
    {
      label: "手机号",
      prop: "phone",
      searchable: true,
      sortable: true,
      minWidth: 130
    },
    {
      label: "邮箱",
      prop: "email",
      searchable: true,
      sortable: true,
      minWidth: 180
    },
    {
      label: "角色",
      prop: "roles",
      searchable: false,
      sortable: false,
      minWidth: 180,
      formatter: (row: any) => {
        if (row.roles && row.roles.length > 0) {
          const map = roleNameMap?.value || {};
          return row.roles
            .map((roleName: string) => map[roleName] || roleName)
            .join(", ");
        }
        return "-";
      }
    },
    {
      label: "性别",
      prop: "gender",
      searchable: false,
      sortable: false,
      minWidth: 90,
      formatter: (row: any) => {
        const gender = row.gender;
        if (gender === "M" || gender === "0" || gender === 0) return "男";
        if (gender === "F" || gender === "1" || gender === 1) return "女";
        return "-";
      }
    },
    {
      label: "状态",
      prop: "status",
      searchable: false,
      sortable: true,
      minWidth: 100,
      cellRenderer: (scope: any) =>
        h(
          ElTag,
          {
            type: scope.row.status === "disable" ? "danger" : "success",
            effect: "light"
          },
          () => (scope.row.status === "disable" ? "已停用" : "已启用")
        )
    },
    {
      label: "更新时间",
      prop: "updateTime",
      searchable: false,
      sortable: "custom",
      minWidth: 190,
      formatter: (row: any) => {
        if (row.updateTime) {
          return new Date(row.updateTime).toLocaleString().replaceAll("/", "-");
        }
        return "-";
      }
    },
    {
      label: "操作",
      fixed: "right",
      width: 200,
      slot: "operation"
    }
  ];

  function handleDisableMember(row: UserMemberInfo & { status?: string }) {
    if (row.status === "disable") {
      ElMessage.warning("该用户已处于停用状态");
      return;
    }

    ElMessageBox.confirm(
      `确定要停用用户 "${row.nickname || row.username}" 吗？停用后该用户将无法登录系统。`,
      "停用确认",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }
    )
      .then(async () => {
        try {
          const res = await disableUserMember(row.id);
          if (res.code === 200) {
            ElMessage.success("用户已成功停用");
            (row as any).status = "disable";
            onStatusChange?.();
          }
        } catch (error) {
          console.error("停用用户失败:", error);
          ElMessage.error("停用用户失败，请重试");
        }
      })
      .catch(() => {});
  }

  function handleEnableMember(row: UserMemberInfo & { status?: string }) {
    if (row.status !== "disable") {
      ElMessage.warning("该用户已处于启用状态");
      return;
    }

    ElMessageBox.confirm(
      `确定要启用用户 "${row.nickname || row.username}" 吗？启用后该用户将可以登录系统。`,
      "启用确认",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "success"
      }
    )
      .then(async () => {
        try {
          const res = await enableUserMember(row.id);
          if (res.code === 200) {
            ElMessage.success("用户已成功启用");
            (row as any).status = "active";
            onStatusChange?.();
          }
        } catch (error) {
          console.error("启用用户失败:", error);
          ElMessage.error("启用用户失败，请重试");
        }
      })
      .catch(() => {});
  }

  function handleBatchDisabledMembers(
    rows: Array<UserMemberInfo & { status?: string }>
  ) {
    if (rows.length === 0) {
      ElMessage.warning("请先选择要停用的用户");
      return;
    }

    const alreadyDisabled = rows.filter(row => row.status === "disable");
    if (alreadyDisabled.length === rows.length) {
      ElMessage.warning("所选用户已全部处于停用状态");
      return;
    }

    ElMessageBox.confirm(
      `确定要停用选中的 ${rows.length} 个用户吗？`,
      "批量停用确认",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }
    )
      .then(async () => {
        try {
          const userIds = rows
            .filter(row => row.status !== "disable")
            .map(row => row.id);
          if (userIds.length > 0) {
            await Promise.all(userIds.map(id => disableUserMember(id)));
            ElMessage.success(`成功停用 ${userIds.length} 个用户`);
            rows.forEach(row => {
              if (row.status !== "disable") {
                (row as any).status = "disable";
              }
            });
            onStatusChange?.();
          }
        } catch (error) {
          console.error("批量停用用户失败:", error);
          ElMessage.error("批量停用用户失败，请重试");
        }
      })
      .catch(() => {});
  }

  function handleBatchEnabledMembers(
    rows: Array<UserMemberInfo & { status?: string }>
  ) {
    if (rows.length === 0) {
      ElMessage.warning("请先选择要启用的用户");
      return;
    }

    const enabled = rows.filter(row => row.status !== "disable");
    if (enabled.length === rows.length) {
      ElMessage.warning("所选用户已全部处于启用状态");
      return;
    }

    ElMessageBox.confirm(
      `确定要启用选中的 ${rows.length} 个用户吗？`,
      "批量启用确认",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "success"
      }
    )
      .then(async () => {
        try {
          const userIds = rows
            .filter(row => row.status === "disable")
            .map(row => row.id);
          if (userIds.length > 0) {
            await Promise.all(userIds.map(id => enableUserMember(id)));
            ElMessage.success(`成功启用 ${userIds.length} 个用户`);
            rows.forEach(row => {
              if (row.status === "disable") {
                (row as any).status = "active";
              }
            });
            onStatusChange?.();
          }
        } catch (error) {
          console.error("批量启用用户失败:", error);
          ElMessage.error("批量启用用户失败，请重试");
        }
      })
      .catch(() => {});
  }

  function isMemberDisabled(row: UserMemberInfo & { status?: string }) {
    return row.status === "disable";
  }

  return {
    columns,
    handleDisableMember,
    handleEnableMember,
    handleBatchDisabledMembers,
    handleBatchEnabledMembers,
    isMemberDisabled
  };
}
