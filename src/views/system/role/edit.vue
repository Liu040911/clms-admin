<script setup lang="ts">
import {
  batchUpdateRolePermissions,
  createRole,
  getAllPermissionModules,
  getRoleList,
  getRoleById,
  getRolePermissionList,
  updateRole,
  type BatchPermissionUpdateRequest,
  type PermissionModuleBO,
  type RoleBO
} from "@/api/role";
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";

defineOptions({
  name: "RoleEditPage"
});

const route = useRoute();
const router = useRouter();
const roleId = ref((route.query.roleId as string) || "");
const loading = ref(false);

const roleDetail = ref<RoleBO>({
  id: "",
  roleName: "",
  roleDescription: "",
  roleStatus: "active",
  createTime: "",
  updateTime: "",
  lastOperatorName: ""
});

const permissionModuleList = ref<PermissionModuleBO[]>([]);
const selectedPermissions = ref<string[]>([]);
const snapshotPermissions = ref<string[]>([]);

const fetchInitData = async () => {
  loading.value = true;
  try {
    const modulesRes = await getAllPermissionModules();
    permissionModuleList.value = modulesRes.data;

    if (roleId.value) {
      const [roleRes, rolePermissionsRes] = await Promise.all([
        getRoleById(roleId.value),
        getRolePermissionList(roleId.value)
      ]);
      roleDetail.value = roleRes.data;
      selectedPermissions.value = rolePermissionsRes.data.map(item => item.id);
      snapshotPermissions.value = [...selectedPermissions.value];
    }
  } finally {
    loading.value = false;
  }
};

const handleSave = async () => {
  if (!roleDetail.value.roleDescription?.trim()) {
    ElMessage.error("请输入角色名称");
    return;
  }

  loading.value = true;
  try {
    if (!roleId.value) {
      await createRole({
        roleName: roleDetail.value.roleDescription,
        roleDescription: roleDetail.value.roleDescription,
        roleStatus: roleDetail.value.roleStatus
      });

      if (selectedPermissions.value.length) {
        const createdRoleListRes = await getRoleList(
          { page: 1, size: 1 },
          roleDetail.value.roleDescription,
          { sort: "createTime", order: "desc" }
        );
        const createdRoleId = createdRoleListRes.data.records?.[0]?.id;
        if (createdRoleId) {
          await batchUpdateRolePermissions(createdRoleId, {
            permissionsToBind: selectedPermissions.value
          });
        }
      }

      ElMessage.success("角色创建成功");
      router.push("/system/role");
      return;
    }

    await updateRole(roleId.value, {
      roleName: roleDetail.value.roleName,
      roleDescription: roleDetail.value.roleDescription,
      roleStatus: roleDetail.value.roleStatus
    });

    const removeItems = snapshotPermissions.value.filter(
      item => !selectedPermissions.value.includes(item)
    );
    const addItems = selectedPermissions.value.filter(
      item => !snapshotPermissions.value.includes(item)
    );

    if (removeItems.length || addItems.length) {
      const payload: BatchPermissionUpdateRequest = {};
      if (addItems.length) payload.permissionsToBind = addItems;
      if (removeItems.length) payload.permissionsToUnbind = removeItems;
      await batchUpdateRolePermissions(roleId.value, payload);
    }

    ElMessage.success("角色更新成功");
    router.push("/system/role");
  } finally {
    loading.value = false;
  }
};

const handleBack = () => {
  router.push("/system/role");
};

onMounted(() => {
  fetchInitData();
});
</script>

<template>
  <el-card v-loading="loading" shadow="never">
    <div class="page-header">
      <div class="page-title">{{ roleId ? "角色编辑" : "添加角色" }}</div>
      <div class="header-actions">
        <el-button @click="handleBack">返回</el-button>
        <el-button type="success" @click="handleSave">保存</el-button>
      </div>
    </div>

    <el-form>
      <el-form-item label="角色名称">
        <el-input
          v-model="roleDetail.roleDescription"
          placeholder="请输入角色名称"
        />
      </el-form-item>
    </el-form>

    <el-container
      v-for="(module, index) in permissionModuleList"
      :key="index"
      class="module-container"
    >
      <div class="module-title">{{ module.moduleName }}</div>
      <div class="module-items">
        <div
          v-for="permission in module.permissions"
          :key="permission.id"
          class="module-item"
        >
          <el-checkbox-group v-model="selectedPermissions">
            <el-checkbox :value="permission.id">
              {{ permission.permissionName }}
            </el-checkbox>
          </el-checkbox-group>
        </div>
      </div>
    </el-container>
  </el-card>
</template>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.page-title {
  font-size: 16px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.module-container {
  margin-top: 12px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
  padding: 14px;
  display: flex;
  align-items: flex-start;
}

.module-title {
  width: 280px;
  color: var(--el-text-color-primary);
  line-height: 1.5;
}

.module-items {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 8px 0;
}

.module-item {
  width: 25%;
}
</style>
