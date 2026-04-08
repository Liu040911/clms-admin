import { ElMessage, ElMessageBox, ElTag } from "element-plus";
import { h } from "vue";
import { updateRole, type RoleBO } from "@/api/role";
import type { TableColumns } from "@pureadmin/table";

export type MyTableColumns = TableColumns & {
  searchable?: boolean;
};

export type MyTableColumnList = MyTableColumns[];

export function useColumns(onChanged?: () => void) {
  const columns: MyTableColumnList = [
    { type: "selection", align: "left" },
    { label: "角色ID", prop: "id", minWidth: 260, fixed: "left" },
    { label: "角色名称", prop: "roleDescription", minWidth: 180 },
    {
      label: "角色状态",
      prop: "roleStatus",
      minWidth: 120,
      cellRenderer: scope =>
        h(
          ElTag,
          {
            type: scope.row.roleStatus === "active" ? "success" : "danger",
            effect: "light"
          },
          () => (scope.row.roleStatus === "active" ? "已启用" : "已停用")
        )
    },
    {
      label: "修改时间",
      prop: "updateTime",
      sortable: "custom",
      minWidth: 180,
      formatter: row => row.updateTime || "-"
    },
    {
      label: "操作",
      fixed: "right",
      width: 240,
      slot: "operation"
    }
  ];

  const handleStatusChange = async (row: RoleBO) => {
    const isEnable = row.roleStatus !== "active";
    const target = isEnable ? "active" : "disabled";
    const text = isEnable ? "启用" : "停用";

    await ElMessageBox.confirm(
      `确定要${text}角色“${row.roleDescription}”吗？`,
      "操作确认",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }
    );

    await updateRole(row.id, {
      roleName: row.roleName,
      roleDescription: row.roleDescription,
      roleStatus: target
    });

    row.roleStatus = target;
    ElMessage.success(`角色已${text}`);
    onChanged?.();
  };

  const handleBatchEnableRoles = async (rows: RoleBO[]) => {
    const targetRows = rows.filter(item => item.roleStatus === "disabled");
    if (!targetRows.length) {
      ElMessage.warning("没有可启用的角色");
      return;
    }

    await ElMessageBox.confirm(
      `确定批量启用 ${targetRows.length} 个角色吗？`,
      "批量启用",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }
    );

    await Promise.all(
      targetRows.map(item =>
        updateRole(item.id, {
          roleName: item.roleName,
          roleDescription: item.roleDescription,
          roleStatus: "active"
        })
      )
    );

    targetRows.forEach(item => {
      item.roleStatus = "active";
    });
    ElMessage.success(`成功启用 ${targetRows.length} 个角色`);
    onChanged?.();
  };

  const handleBatchDisableRoles = async (rows: RoleBO[]) => {
    const targetRows = rows.filter(
      item => item.roleStatus === "active" && item.roleName !== "admin"
    );
    if (!targetRows.length) {
      ElMessage.warning("没有可停用的角色");
      return;
    }

    await ElMessageBox.confirm(
      `确定批量停用 ${targetRows.length} 个角色吗？`,
      "批量停用",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }
    );

    await Promise.all(
      targetRows.map(item =>
        updateRole(item.id, {
          roleName: item.roleName,
          roleDescription: item.roleDescription,
          roleStatus: "disabled"
        })
      )
    );

    targetRows.forEach(item => {
      item.roleStatus = "disabled";
    });
    ElMessage.success(`成功停用 ${targetRows.length} 个角色`);
    onChanged?.();
  };

  return {
    columns,
    handleStatusChange,
    handleBatchEnableRoles,
    handleBatchDisableRoles
  };
}
