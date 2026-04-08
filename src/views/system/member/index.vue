<script setup lang="ts">
defineOptions({
  name: "MemberPage"
});

import { useRouter } from "vue-router";
import {
  getMemberList,
  type MemberBO,
  type AdminUserInfo,
  type MemberQueryParams
} from "@/api/member";
import { PaginationProps } from "@pureadmin/table";
import { reactive, ref, onMounted } from "vue";
import MyTable from "@/components/myTable/MyTable.vue";
import { Plus, Search, CircleClose, Check } from "@element-plus/icons-vue";
import { useColumns } from "./components/columns";
import { useSearch } from "./hooks/useSearch";

const router = useRouter();
const pageConfig = reactive({
  loading: false,
  tableData: [] as MemberBO[]
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

const selectedRows = ref<MemberBO[]>([]);

const toMemberBO = (user: AdminUserInfo): MemberBO => {
  const nickname = user.nickname || user.username || "";
  return {
    id: user.id,
    memberInfo: {
      id: user.id,
      name: nickname,
      nickname,
      email: user.email || "",
      phone: user.phone || "",
      avatar: user.avatar,
      gender: user.gender,
      createTime: user.createTime || "",
      updateTime: user.updateTime || ""
    },
    roles: (user.roles || []).map((roleName, index) => ({
      id: `${index}-${roleName}`,
      roleName,
      roleDescription: resolveRoleDisplayName(roleName)
    })),
    status: "active",
    createTime: user.createTime || "",
    updateTime: user.updateTime || ""
  };
};

const resolveRoleDisplayName = (roleName: string) => {
  return roleOptions.value.find(role => role.id === roleName)?.name || roleName;
};

// 使用列定义
const {
  columns,
  handleDisableMember,
  handleEnableMember,
  handleBatchDisabledMembers,
  handleBatchEnabledMembers,
  isMemberDisabled
} = useColumns(() => {
  // 状态变化时刷新列表
  fetchMemberList();
});

// 定义fetchMemberList函数
const fetchMemberList = () => {
  pageConfig.loading = true;

  // 构建查询参数
  const queryParams: MemberQueryParams = {
    page: pagination.currentPage,
    size: pagination.pageSize,
    ...getQueryParams()
  };

  getMemberList(queryParams)
    .then(res => {
      if (res.code === 200) {
        const query = getQueryParams();
        let records = (res.data.records || []).map(toMemberBO);

        if (query.nickname) {
          records = records.filter(item =>
            (item.memberInfo.nickname || "").includes(query.nickname)
          );
        }
        if (query.phone) {
          records = records.filter(item =>
            (item.memberInfo.phone || "").includes(query.phone)
          );
        }
        if (query.email) {
          records = records.filter(item =>
            (item.memberInfo.email || "").includes(query.email)
          );
        }
        if (query.roleIds && query.roleIds.length > 0) {
          records = records.filter(item => {
            const roleNames = (item.roles || []).map(role => role.roleName);
            return query.roleIds?.some(roleId => roleNames.includes(roleId));
          });
        }

        pageConfig.tableData = records;
        pagination.total = records.length;
      }
      pageConfig.loading = false;
    })
    .catch(error => {
      console.error("获取成员列表失败:", error);
      pageConfig.loading = false;
    });
};

// 使用搜索钩子
const {
  searchConfig,
  roleIds,
  roleOptions,
  statusFilter,
  loadingRoles,
  sortConfig,
  fetchRoleOptions,
  resetSearch,
  sortChange,
  getQueryParams
} = useSearch(fetchMemberList);

onMounted(() => {
  // 获取成员列表
  fetchMemberList();

  // 获取各项下拉选择数据
  fetchRoleOptions().then(() => {
    // 角色选项加载完成后刷新一次列表，确保角色列显示角色名称
    fetchMemberList();
  });
});

const goToEdit = (row?: MemberBO) => {
  router.push({
    path: "/system/member/edit",
    query: row ? { memberId: row.id } : {}
  });
};
</script>

<template>
  <div>
    <!-- 筛选和搜索卡片 -->
    <el-card shadow="never" class="mb-4">
      <div class="flex flex-col">
        <!-- 筛选条件第一行：角色、状态 -->
        <div class="grid grid-cols-4 gap-4 mb-4">
          <!-- 角色筛选 -->
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

          <!-- 状态筛选 -->
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

        <!-- 搜索条件第二行：昵称、手机号、邮箱 -->
        <div class="grid grid-cols-4 gap-4 mb-4">
          <!-- 昵称 -->
          <div class="flex items-center">
            <span class="mr-2 whitespace-nowrap">昵称：</span>
            <el-input
              v-model="searchConfig.nickname"
              placeholder="请输入昵称"
              class="flex-1"
              @keyup.enter="fetchMemberList"
            />
          </div>

          <!-- 手机号 -->
          <div class="flex items-center">
            <span class="mr-2 whitespace-nowrap">手机号：</span>
            <el-input
              v-model="searchConfig.phone"
              placeholder="请输入手机号"
              class="flex-1"
              @keyup.enter="fetchMemberList"
            />
          </div>

          <!-- 邮箱 -->
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

        <!-- 按钮区域 -->
        <div class="flex items-center">
          <el-button type="primary" :icon="Search" @click="fetchMemberList"
            >搜索</el-button
          >
          <el-button class="ml-2" @click="resetSearch">重置</el-button>
        </div>
      </div>
    </el-card>

    <!-- 数据表格卡片 -->
    <el-card shadow="never">
      <div class="flex justify-between items-center mb-4">
        <div>
          <el-button type="primary" :icon="Plus" @click="goToEdit()"
            >新增成员</el-button
          >
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
        <!-- 自定义操作列 -->
        <template #customOperation="{ row }">
          <div class="flex flex-nowrap gap-2">
            <!-- 编辑按钮 -->
            <el-button type="primary" size="small" @click.stop="goToEdit(row)">
              编辑
            </el-button>

            <!-- 停用按钮，仅对未停用的成员显示 -->
            <el-button
              v-if="!isMemberDisabled(row)"
              type="danger"
              size="small"
              @click.stop="handleDisableMember(row)"
            >
              停用
            </el-button>

            <!-- 启用按钮，仅对已停用的成员显示 -->
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
