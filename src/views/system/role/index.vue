<script setup lang="ts">
import {
  deleteRole,
  getRoleList,
  type RoleBO
} from "@/api/role";
import MyTable from "@/components/myTable/MyTable.vue";
import { PaginationProps } from "@pureadmin/table";
import {
  Plus,
  Search,
  Check,
  CircleClose,
  View,
  Edit
} from "@element-plus/icons-vue";
import { onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { useColumns } from "./components/columns";
import RoleDetailDialog from "./components/RoleDetailDialog.vue";

defineOptions({
  name: "RolePage"
});

const router = useRouter();
const pageConfig = reactive({
  loading: false,
  tableData: [] as RoleBO[]
});

const pagination = reactive<PaginationProps>({
  pageSize: 10,
  currentPage: 1,
  pageSizes: [10, 15, 20],
  total: 0,
  align: "right",
  background: true,
  size: "default"
});

const sortConfig = reactive({
  prop: "updateTime",
  order: "desc" as "asc" | "desc"
});

const searchConfig = reactive({
  input: ""
});

const selectedRows = ref<RoleBO[]>([]);
const detailDialogVisible = ref(false);
const currentRole = ref<RoleBO | null>(null);

const {
  columns,
  handleStatusChange,
  handleBatchEnableRoles,
  handleBatchDisableRoles
} = useColumns(() => {
  fetchRoleList();
});

const fetchRoleList = () => {
  pageConfig.loading = true;
  getRoleList(
    {
      page: pagination.currentPage,
      size: pagination.pageSize
    },
    searchConfig.input,
    {
      sort: sortConfig.prop,
      order: sortConfig.order
    }
  )
    .then(res => {
      pageConfig.tableData = res.data.records;
      pagination.total = res.data.total;
    })
    .finally(() => {
      pageConfig.loading = false;
    });
};

const sortChange = (prop: string, order: string) => {
  sortConfig.prop = prop;
  sortConfig.order = order === "ascending" ? "asc" : "desc";
  fetchRoleList();
};

const goToAddRole = () => {
  router.push("/system/role/edit");
};

const editRole = (row: RoleBO) => {
  router.push({
    path: "/system/role/edit",
    query: { roleId: row.id }
  });
};

const enableRole = (row: RoleBO) => {
  if (row.roleStatus === "disabled") {
    handleStatusChange(row);
  }
};

const disableRole = (row: RoleBO) => {
  if (row.roleStatus === "active") {
    handleStatusChange(row);
  }
};

const batchEnableRoles = () => {
  handleBatchEnableRoles(selectedRows.value);
};

const batchDisableRoles = () => {
  handleBatchDisableRoles(selectedRows.value);
};

const viewRoleDetail = (row: RoleBO) => {
  currentRole.value = row;
  detailDialogVisible.value = true;
};

const removeRole = (row: RoleBO) => {
  deleteRole(row.id).then(() => {
    fetchRoleList();
  });
};

onMounted(() => {
  fetchRoleList();
});
</script>

<template>
  <div>
    <el-card shadow="never">
      <div class="flex justify-between items-center">
        <div class="flex items-center gap-3">
          <el-button type="primary" :icon="Plus" @click="goToAddRole">
            添加角色
          </el-button>
          <el-button
            type="danger"
            :icon="CircleClose"
            :disabled="selectedRows.length === 0"
            @click="batchDisableRoles"
          >
            批量停用
          </el-button>
          <el-button
            type="success"
            :icon="Check"
            :disabled="selectedRows.length === 0"
            @click="batchEnableRoles"
          >
            批量启用
          </el-button>
        </div>

        <el-input
          v-model="searchConfig.input"
          placeholder="搜索角色名称"
          style="width: 320px"
          @keyup.enter="fetchRoleList"
        >
          <template #append>
            <el-button :icon="Search" @click="fetchRoleList" />
          </template>
        </el-input>
      </div>

      <div class="mt-4">
        <MyTable
          v-model="pageConfig.tableData"
          :loading="pageConfig.loading"
          :columns="columns"
          :pagination="pagination"
          :fetch-data="fetchRoleList"
          :handle-sort-change="sortChange"
          :handle-selection-change="rows => (selectedRows.value = rows)"
        >
          <template #customOperation="{ row }">
            <div class="flex flex-nowrap gap-2">
              <el-button
                type="info"
                plain
                size="small"
                :icon="View"
                @click="viewRoleDetail(row)"
              >
                查看
              </el-button>
              <el-button
                type="primary"
                size="small"
                :icon="Edit"
                @click="editRole(row)"
              >
                编辑
              </el-button>
              <el-button
                v-if="row.roleStatus === 'active'"
                type="danger"
                size="small"
                :icon="CircleClose"
                @click="disableRole(row)"
              >
                停用
              </el-button>
              <el-button
                v-if="row.roleStatus === 'disabled'"
                type="success"
                size="small"
                :icon="Check"
                @click="enableRole(row)"
              >
                启用
              </el-button>
            </div>
          </template>
        </MyTable>
      </div>
    </el-card>

    <RoleDetailDialog
      v-model:visible="detailDialogVisible"
      :role-data="currentRole"
    />
  </div>
</template>
