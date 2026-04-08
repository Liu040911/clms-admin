<script setup lang="ts">
import type { RoleBO } from "@/api/role";

defineProps<{
  roleData: RoleBO | null;
}>();

const visible = defineModel<boolean>("visible", { default: false });
</script>

<template>
  <el-dialog v-model="visible" title="角色详情" width="520px">
    <div v-if="roleData" class="detail-wrap">
      <div class="detail-item">
        <span class="label">角色ID：</span>{{ roleData.id }}
      </div>
      <div class="detail-item">
        <span class="label">角色名称：</span>{{ roleData.roleDescription }}
      </div>
      <div class="detail-item">
        <span class="label">状态：</span>
        <el-tag
          :type="roleData.roleStatus === 'active' ? 'success' : 'danger'"
          effect="light"
        >
          {{ roleData.roleStatus === "active" ? "已启用" : "已停用" }}
        </el-tag>
      </div>
      <div class="detail-item">
        <span class="label">设定人：</span
        >{{ roleData.lastOperatorName || "系统" }}
      </div>
      <div class="detail-item">
        <span class="label">修改时间：</span>{{ roleData.updateTime }}
      </div>
    </div>
    <template #footer>
      <el-button type="primary" @click="visible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.detail-wrap {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-item {
  line-height: 1.6;
  word-break: break-all;
}

.label {
  color: var(--el-text-color-regular);
}
</style>
