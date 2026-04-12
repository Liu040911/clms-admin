<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import dayjs from "dayjs";
import { PaginationProps } from "@pureadmin/table";
import {
  getLectureAuditList,
  type LectureAuditBO
} from "@/api/lecture";
import { ElMessage } from "element-plus";

defineOptions({
  name: "LectureAuditDialog"
});

interface Props {
  modelValue: boolean;
  lectureId: string;
  lectureTitle?: string;
}

const props = withDefaults(defineProps<Props>(), {
  lectureTitle: ""
});

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
}>();

const dialogVisible = computed({
  get: () => props.modelValue,
  set: value => emit("update:modelValue", value)
});

const loading = ref(false);
const auditRecords = ref<LectureAuditBO[]>([]);

const pagination = reactive<PaginationProps>({
  pageSize: 10,
  currentPage: 1,
  pageSizes: [10, 15, 20],
  total: 0,
  align: "right",
  background: true,
  size: "default"
});

const actionTextMap: Record<string, string> = {
  approve: "通过",
  reject: "驳回"
};

const statusTextMap: Record<string, string> = {
  draft: "草稿",
  pending: "待审核",
  reject: "已驳回",
  published: "已发布",
  finished: "已结束",
  cancelled: "已取消"
};

const actionTagTypeMap: Record<string, "success" | "danger"> = {
  approve: "success",
  reject: "danger"
};

const statusTagTypeMap: Record<string, "success" | "warning" | "info" | "danger"> = {
  draft: "info",
  pending: "warning",
  reject: "danger",
  published: "success",
  finished: "info",
  cancelled: "danger"
};

const formatTime = (value?: string) => {
  if (!value) return "-";
  return dayjs(value).isValid()
    ? dayjs(value).format("YYYY-MM-DD HH:mm")
    : value;
};

const getActionTagType = (action: string) => {
  return actionTagTypeMap[action] || "info";
};

const getStatusTagType = (status: string) => {
  return statusTagTypeMap[status] || "info";
};

const fetchAuditRecords = async () => {
  if (!props.lectureId) {
    auditRecords.value = [];
    pagination.total = 0;
    return;
  }

  loading.value = true;
  try {
    const res = await getLectureAuditList({
      lectureId: props.lectureId,
      page: pagination.currentPage,
      size: pagination.pageSize
    });

    if (res.code === 200) {
      auditRecords.value = res.data.records || [];
      pagination.total = res.data.total || 0;
      return;
    }

    ElMessage.error(res.msg || "获取审核记录失败");
  } catch (error) {
    console.error("获取审核记录失败:", error);
    ElMessage.error("获取审核记录失败");
  } finally {
    loading.value = false;
  }
};

const handleCurrentChange = (page: number) => {
  pagination.currentPage = page;
  fetchAuditRecords();
};

const handleSizeChange = (size: number) => {
  pagination.pageSize = size;
  pagination.currentPage = 1;
  fetchAuditRecords();
};

watch(
  () => dialogVisible.value,
  visible => {
    if (!visible) {
      auditRecords.value = [];
      pagination.total = 0;
      pagination.currentPage = 1;
      return;
    }

    pagination.currentPage = 1;
    fetchAuditRecords();
  }
);
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    title="审核记录"
    width="980px"
    destroy-on-close
  >
    <div class="space-y-4">
      <div class="text-sm text-gray-600">
        讲座：{{ lectureTitle || lectureId || "-" }}
      </div>

      <el-table v-loading="loading" :data="auditRecords" border stripe>
        <el-table-column prop="createTime" label="审核时间" min-width="160">
          <template #default="scope">
            {{ formatTime(scope.row.createTime) }}
          </template>
        </el-table-column>

        <el-table-column prop="auditAction" label="审核动作" width="120">
          <template #default="scope">
            <el-tag :type="getActionTagType(scope.row.auditAction)" effect="light">
              {{ actionTextMap[scope.row.auditAction] || scope.row.auditAction || "-" }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="beforeStatus" label="审核前状态" width="140">
          <template #default="scope">
            <el-tag :type="getStatusTagType(scope.row.beforeStatus)" effect="light">
              {{ statusTextMap[scope.row.beforeStatus] || scope.row.beforeStatus || "-" }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="afterStatus" label="审核后状态" width="140">
          <template #default="scope">
            <el-tag :type="getStatusTagType(scope.row.afterStatus)" effect="light">
              {{ statusTextMap[scope.row.afterStatus] || scope.row.afterStatus || "-" }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="auditorName" label="审核人" min-width="130">
          <template #default="scope">
            {{ scope.row.auditorName || scope.row.auditorId || "-" }}
          </template>
        </el-table-column>

        <el-table-column prop="reason" label="原因" min-width="220" show-overflow-tooltip>
          <template #default="scope">
            {{ scope.row.reason || "-" }}
          </template>
        </el-table-column>
      </el-table>

      <div class="flex justify-end">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="pagination.pageSizes"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @current-change="handleCurrentChange"
          @size-change="handleSizeChange"
        />
      </div>
    </div>

    <template #footer>
      <el-button @click="dialogVisible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>
