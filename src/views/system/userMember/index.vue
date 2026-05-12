<script setup lang="ts">
defineOptions({
  name: "UserMemberPage"
});

import { useRouter } from "vue-router";
import {
  getUserMemberList,
  type UserMemberInfo,
  type UserMemberQueryParams
} from "@/api/userMember";
import { PaginationProps } from "@pureadmin/table";
import { reactive, ref, onMounted } from "vue";
import MyTable from "@/components/myTable/MyTable.vue";
import { Search, CircleClose, Check } from "@element-plus/icons-vue";
import { useColumns } from "./components/columns";
import { useSearch } from "./hooks/useSearch";

const router = useRouter();
const pageConfig = reactive({
  loading: false,
  tableData: [] as UserMemberInfo[]
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

const selectedRows = ref<UserMemberInfo[]>([]);

function fetchMemberList() {
  pageConfig.loading = true;

  const queryParams: UserMemberQueryParams = {
    page: pagination.currentPage,
    size: pagination.pageSize,
    ...getQueryParams()
  };

  getUserMemberList(queryParams)
    .then(res => {
      if (res.code === 200) {
        const query = getQueryParams();
        let records = (res.data.records || []).map(user => ({
          ...user,
          status: "active" as string
        }));

        if (query.nickname) {
          records = records.filter(item =>
            (item.nickname || "").includes(query.nickname)
          );
        }
        if (query.phone) {
          records = records.filter(item =>
            (item.phone || "").includes(query.phone)
          );
        }
        if (query.email) {
          records = records.filter(item =>
            (item.email || "").includes(query.email)
          );
        }

        pageConfig.tableData = records;
        pagination.total = records.length;
      }
      pageConfig.loading = false;
    })
    .catch(error => {
      console.error("获取用户列表失败:", error);
      pageConfig.loading = false;
    });
}

const {
  searchConfig,
  roleIds,
  roleOptions,
  statusFilter,
  loadingRoles,
  roleNameMap,
  fetchRoleOptions,
  resetSearch,
  sortChange,
  getQueryParams
} = useSearch(fetchMemberList);

const {
  columns,
  handleDisableMember,
  handleEnableMember,
  handleBatchDisabledMembers,
  handleBatchEnabledMembers,
  isMemberDisabled
} = useColumns(() => {
  fetchMemberList();
}, roleNameMap);

onMounted(() => {
  fetchMemberList();
  fetchRoleOptions().then(() => {
    fetchMemberList();
  });
});

const goToEdit = (row?: UserMemberInfo) => {
  router.push({
    path: "/system/userMember/edit",
    query: row ? { userId: row.id } : {}
  });
};
</script>

<template>
  <div>
    <el-card shadow="never" class="mb-4">
      <div class="flex flex-col">
        <div class="grid grid-cols-4 gap-4 mb-4">
          <div class="flex items-center">
            <span class="mr-2 whitespace-nowrap">角色：</span>
            <el-select
              v-model="roleIds"
              placeholder="全部"
              class="flex-1"
              multiple
              collapse-tags
              collapse-tags-tooltip
              :max-collapse-tags="1"
              :loading="loadingRoles"
              @change="fetchMemberList"
            >
              <el-option
                v-for="role in roleOptions"
                :key="role.id"
                :label="role.name"
                :value="role.id"
              />
            </el-select>
          </div>

          <div class="flex items-center">
            <span class="mr-2 whitespace-nowrap">状态：</span>
            <el-select
              v-model="statusFilter"
              placeholder="全部状态"
              class="flex-1"
              @change="fetchMemberList"
            >
              <el-option label="全部" value="all" />
              <el-option label="已启用" value="active" />
              <el-option label="已停用" value="disable" />
            </el-select>
          </div>
        </div>

        <div class="grid grid-cols-4 gap-4 mb-4">
          <div class="flex items-center">
            <span class="mr-2 whitespace-nowrap">昵称：</span>
            <el-input
              v-model="searchConfig.nickname"
              placeholder="请输入昵称"
              class="flex-1"
              @keyup.enter="fetchMemberList"
            />
          </div>

          <div class="flex items-center">
            <span class="mr-2 whitespace-nowrap">手机号：</span>
            <el-input
              v-model="searchConfig.phone"
              placeholder="请输入手机号"
              class="flex-1"
              @keyup.enter="fetchMemberList"
            />
          </div>

          <div class="flex items-center">
            <span class="mr-2 whitespace-nowrap">邮箱：</span>
            <el-input
              v-model="searchConfig.email"
              placeholder="请输入邮箱"
              class="flex-1"
              @keyup.enter="fetchMemberList"
            />
          </div>
        </div>

        <div class="flex items-center">
          <el-button type="primary" :icon="Search" @click="fetchMemberList"
            >搜索</el-button
          >
          <el-button class="ml-2" @click="resetSearch">重置</el-button>
        </div>
      </div>
    </el-card>

    <el-card shadow="never">
      <div class="flex justify-between items-center mb-4">
        <div>
          <el-button
            type="danger"
            :icon="CircleClose"
            :disabled="selectedRows.length === 0"
            @click="handleBatchDisabledMembers(selectedRows)"
          >
            批量停用
          </el-button>
          <el-button
            type="success"
            :icon="Check"
            :disabled="selectedRows.length === 0"
            @click="handleBatchEnabledMembers(selectedRows)"
          >
            批量启用
          </el-button>
        </div>
      </div>

      <MyTable
        v-model="pageConfig.tableData"
        :loading="pageConfig.loading"
        :columns="columns"
        :pagination="pagination"
        :fetch-data="fetchMemberList"
        :handle-sort-change="sortChange"
        :handle-selection-change="rows => (selectedRows = rows)"
        :rowClickable="false"
      >
        <template #customOperation="{ row }">
          <div class="flex flex-nowrap gap-2">
            <el-button type="primary" size="small" @click.stop="goToEdit(row)">
              编辑
            </el-button>

            <el-button
              v-if="!isMemberDisabled(row)"
              type="danger"
              size="small"
              @click.stop="handleDisableMember(row)"
            >
              停用
            </el-button>

            <el-button
              v-if="isMemberDisabled(row)"
              type="success"
              size="small"
              @click.stop="handleEnableMember(row)"
            >
              启用
            </el-button>
          </div>
        </template>
      </MyTable>
    </el-card>
  </div>
</template>

<style lang="scss" scoped></style>
