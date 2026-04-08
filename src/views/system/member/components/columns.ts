import { ElMessageBox, ElMessage, ElTag } from "element-plus";
import { h } from "vue";
import { disableMember, enableMember, type MemberBO } from "@/api/member";
import type { TableColumns } from "@pureadmin/table";

export type MyTableColumns = TableColumns & {
  searchable?: boolean;
};

export type MyTableColumnList = MyTableColumns[];

/**
 * 表格列定义钩子
 */
export function useColumns(onStatusChange?: () => void) {
  const columns: MyTableColumnList = [
    { type: "selection", align: "left" },
    {
      label: "昵称",
      prop: "memberInfo.nickname",
      searchable: true,
      sortable: true,
      minWidth: 120,
      formatter: (row: any) => {
        return row.memberInfo?.nickname || "-";
      }
    },
    {
      label: "手机号",
      prop: "memberInfo.phone",
      searchable: true,
      sortable: true,
      minWidth: 130,
      formatter: (row: any) => {
        return row.memberInfo?.phone || "-";
      }
    },
    {
      label: "邮箱",
      prop: "memberInfo.email",
      searchable: true,
      sortable: true,
      minWidth: 180,
      formatter: (row: any) => {
        return row.memberInfo?.email || "-";
      }
    },
    {
      label: "角色",
      prop: "roles",
      searchable: false,
      sortable: false,
      minWidth: 180,
      formatter: (row: any) => {
        if (row.roles && row.roles.length > 0) {
          return row.roles
            .map((role: any) => role.roleDescription || role.roleName)
            .join(", ");
        }
        return "-";
      }
    },
    {
      label: "性别",
      prop: "memberInfo.gender",
      searchable: false,
      sortable: false,
      minWidth: 90,
      formatter: (row: any) => {
        const gender = row.memberInfo?.gender;
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

  /**
   * 停用单个成员
   */
  function handleDisableMember(row: MemberBO) {
    if (row.status === "disable") {
      ElMessage.warning("该成员已处于停用状态");
      return;
    }

    ElMessageBox.confirm(
      `确定要停用成员 "${row.memberInfo.name}" 吗？停用后该成员将无法登录系统。`,
      "停用确认",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }
    )
      .then(async () => {
        try {
          const res = await disableMember(row.id);
          if (res.code === 200) {
            ElMessage.success("成员已成功停用");
            row.status = "disable";
            onStatusChange?.();
          }
        } catch (error) {
          console.error("停用成员失败:", error);
          ElMessage.error("停用成员失败，请重试");
        }
      })
      .catch(() => {
        // 用户取消操作
      });
  }

  /**
   * 启用单个成员
   */
  function handleEnableMember(row: MemberBO) {
    if (row.status !== "disable") {
      ElMessage.warning("该成员已处于启用状态");
      return;
    }

    ElMessageBox.confirm(
      `确定要启用成员 "${row.memberInfo.name}" 吗？启用后该成员将可以登录系统。`,
      "启用确认",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "success"
      }
    )
      .then(async () => {
        try {
          const res = await enableMember(row.id);
          if (res.code === 200) {
            ElMessage.success("成员已成功启用");
            row.status = "active";
            onStatusChange?.();
          }
        } catch (error) {
          console.error("启用成员失败:", error);
          ElMessage.error("启用成员失败，请重试");
        }
      })
      .catch(() => {
        // 用户取消操作
      });
  }

  /**
   * 批量停用成员
   */
  function handleBatchDisabledMembers(rows: MemberBO[]) {
    if (rows.length === 0) {
      ElMessage.warning("请先选择要停用的成员");
      return;
    }

    const alreadyDisabledMembers = rows.filter(
      (row: MemberBO) => row.status === "disable"
    );

    if (alreadyDisabledMembers.length === rows.length) {
      ElMessage.warning("所选成员已全部处于停用状态");
      return;
    }

    ElMessageBox.confirm(
      `确定要停用选中的 ${rows.length} 个成员吗？${
        alreadyDisabledMembers.length > 0
          ? `(其中 ${alreadyDisabledMembers.length} 个成员已处于停用状态)`
          : ""
      }`,
      "批量停用确认",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }
    )
      .then(async () => {
        try {
          // 获取未停用的成员的ID
          const memberIds = rows
            .filter(row => row.status !== "disable")
            .map(row => row.id);

          if (memberIds.length > 0) {
            await Promise.all(memberIds.map(id => disableMember(id)));
            ElMessage.success(`成功停用 ${memberIds.length} 个成员`);
            // 更新本地数据状态
            rows.forEach(row => {
              if (row.status !== "disable") {
                row.status = "disable";
              }
            });
            onStatusChange?.();
          }
        } catch (error) {
          console.error("批量停用成员失败:", error);
          ElMessage.error("批量停用成员失败，请重试");
        }
      })
      .catch(() => {
        // 用户取消操作
      });
  }

  /**
   * 批量启用成员
   */
  function handleBatchEnabledMembers(rows: MemberBO[]) {
    if (rows.length === 0) {
      ElMessage.warning("请先选择要启用的成员");
      return;
    }

    const enabledMembers = rows.filter(
      (row: MemberBO) => row.status !== "disable"
    );

    if (enabledMembers.length === rows.length) {
      ElMessage.warning("所选成员已全部处于启用状态");
      return;
    }

    ElMessageBox.confirm(
      `确定要启用选中的 ${rows.length} 个成员吗？${
        enabledMembers.length > 0
          ? `(其中 ${enabledMembers.length} 个成员已处于启用状态)`
          : ""
      }`,
      "批量启用确认",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "success"
      }
    )
      .then(async () => {
        try {
          // 获取已停用的成员的ID
          const memberIds = rows
            .filter(row => row.status === "disable")
            .map(row => row.id);

          if (memberIds.length > 0) {
            await Promise.all(memberIds.map(id => enableMember(id)));
            ElMessage.success(`成功启用 ${memberIds.length} 个成员`);
            // 更新本地数据状态
            rows.forEach(row => {
              if (row.status === "disable") {
                row.status = "active";
              }
            });
            onStatusChange?.();
          }
        } catch (error) {
          console.error("批量启用成员失败:", error);
          ElMessage.error("批量启用成员失败，请重试");
        }
      })
      .catch(() => {
        // 用户取消操作
      });
  }

  /**
   * 检查成员是否已停用
   */
  function isMemberDisabled(row: MemberBO) {
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
