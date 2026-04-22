<script setup lang="ts">
import MyTable from "@/components/myTable/MyTable.vue";
import { PaginationProps, type TableColumns } from "@pureadmin/table";
import {
  approveLecture,
  getLectureInfo,
  getLectureList,
  rejectLecture,
  type LectureBO
} from "@/api/lecture";
import LectureDetailDialog from "./components/LectureDetailDialog.vue";
import LectureAuditDialog from "./components/LectureAuditDialog.vue";
import { ElMessage, ElTag } from "element-plus";
import { h, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import dayjs from "dayjs";

defineOptions({
  name: "LecturePage"
});

type LectureItem = LectureBO;

const router = useRouter();

const pageConfig = reactive({
  loading: false,
  tableData: [] as LectureItem[]
});

const detailDialogVisible = ref(false);
const detailLoading = ref(false);
const currentLecture = ref<LectureBO | null>(null);
const auditDialogVisible = ref(false);
const currentAuditLecture = ref<LectureBO | null>(null);
const rejectDialogVisible = ref(false);
const rejectSubmitting = ref(false);
const rejectLectureId = ref("");
const rejectLectureTitle = ref("");
const rejectReason = ref("");

const pagination = reactive<PaginationProps>({
  pageSize: 10,
  currentPage: 1,
  pageSizes: [10, 15, 20],
  total: 0,
  align: "right",
  background: true,
  size: "default"
});
const statusTextMap: Record<string, string> = {
  draft: "草稿",
  pending: "待审核",
  reject: "已驳回",
  published: "已发布",
  finished: "已结束",
  cancelled: "已取消"
};

const statusTagTypeMap: Record<
  string,
  "success" | "warning" | "info" | "danger"
> = {
  draft: "info",
  pending: "warning",
  reject: "danger",
  published: "success",
  finished: "info",
  cancelled: "danger"
};

const isActionLocked = (status: string) => {
  return ["reject", "published"].includes(status);
};

const getStatusTagType = (status: string) => {
  return statusTagTypeMap[status] || "info";
};

const formatTime = (value?: string) => {
  if (!value) return "-";
  return dayjs(value).isValid()
    ? dayjs(value).format("YYYY-MM-DD HH:mm")
    : value;
};

const formatLectureTags = (row: LectureItem) => {
  const tags = row.tags || [];
  if (tags.length === 0) return "-";
  return tags.map(tag => tag.name).filter(Boolean).join(" / ");
};

const columns: TableColumns[] = [
  {
    label: "讲座ID",
    prop: "id",
    minWidth: 220
  },
  {
    label: "讲座标题",
    prop: "title",
    minWidth: 220
  },
  {
    label: "主讲人",
    prop: "teacherName",
    minWidth: 120
  },
  {
    label: "讲座时间",
    prop: "lectureStartTime",
    minWidth: 180,
    formatter: row => formatTime(row.lectureStartTime)
  },
  {
    label: "地点",
    prop: "location",
    minWidth: 160
  },
  {
    label: "讲座标签",
    prop: "tags",
    minWidth: 180,
    formatter: row => formatLectureTags(row)
  },
  {
    label: "状态",
    prop: "status",
    minWidth: 120,
    cellRenderer: scope => {
      const status = scope.row.status || "";
      return h(
        ElTag,
        {
          type: getStatusTagType(status),
          effect: "light",
          class: "lecture-status-tag"
        },
        () => statusTextMap[status] || status || "-"
      );
    }
  },
  {
    label: "操作",
    fixed: "right",
    width: 240,
    slot: "operation"
  }
];

const fetchLectureList = () => {
  pageConfig.loading = true;
  getLectureList({
    page: pagination.currentPage,
    size: pagination.pageSize,
    sort: "createTime",
    order: "desc"
  })
    .then(res => {
      if (res.code === 200) {
        pageConfig.tableData = res.data.records || [];
        pagination.total = res.data.total || 0;
      } else {
        ElMessage.error(res.msg || "获取讲座列表失败");
      }
    })
    .catch(error => {
      console.error("获取讲座列表失败:", error);
      ElMessage.error("获取讲座列表失败");
    })
    .finally(() => {
      pageConfig.loading = false;
    });
};

const handleViewDetail = async (row: LectureItem) => {
  detailDialogVisible.value = true;
  detailLoading.value = true;
  try {
    const res = await getLectureInfo(row.id);
    if (res.code !== 200) {
      ElMessage.error(res.msg || "获取讲座详情失败");
      currentLecture.value = null;
      return;
    }
    currentLecture.value = res.data;
  } catch (error) {
    console.error("获取讲座详情失败:", error);
    ElMessage.error("获取讲座详情失败");
    currentLecture.value = null;
  } finally {
    detailLoading.value = false;
  }
};

const handleViewAuditRecords = (row: LectureItem) => {
  currentAuditLecture.value = row;
  auditDialogVisible.value = true;
};

const handleApprove = async (row: LectureItem) => {
  if (isActionLocked(row.status)) {
    ElMessage.warning("该讲座已进入终态，无法继续通过或驳回");
    return;
  }

  try {
    const res = await approveLecture(row.id);
    if (res.code === 200) {
      ElMessage.success("通过成功");
      fetchLectureList();
      return;
    }
    ElMessage.error(res.msg || "通过失败");
  } catch (error) {
    console.error("通过失败:", error);
    ElMessage.error("通过失败");
  }
};

const openRejectDialog = (row: LectureItem) => {
  if (isActionLocked(row.status)) {
    ElMessage.warning("该讲座已进入终态，无法继续通过或驳回");
    return;
  }

  rejectLectureId.value = row.id;
  rejectLectureTitle.value = row.title;
  rejectReason.value = "";
  rejectDialogVisible.value = true;
};

const submitReject = async () => {
  const reason = rejectReason.value.trim();
  if (!reason) {
    ElMessage.warning("请填写驳回原因");
    return;
  }

  rejectSubmitting.value = true;
  try {
    const res = await rejectLecture(rejectLectureId.value, reason);
    if (res.code === 200) {
      ElMessage.success("驳回成功");
      rejectDialogVisible.value = false;
      fetchLectureList();
      return;
    }
    ElMessage.error(res.msg || "驳回失败");
  } catch (error) {
    console.error("驳回失败:", error);
    ElMessage.error("驳回失败");
  } finally {
    rejectSubmitting.value = false;
  }
};

onMounted(() => {
  fetchLectureList();
});

const handleGoAnalytics = () => {
  router.push({ path: "/lecture/analytics" });
};
</script>

<template>
  <div>
    <el-card shadow="never">
      <div class="mb-4 flex items-center justify-between">
        <div class="text-base font-medium">讲座管理</div>
        <el-button type="primary" plain @click="handleGoAnalytics">
          数据分析
        </el-button>
      </div>

      <MyTable
        v-model="pageConfig.tableData"
        :loading="pageConfig.loading"
        :columns="columns"
        :pagination="pagination"
        :fetch-data="fetchLectureList"
        :row-clickable="false"
      >
        <template #customOperation="{ row }">
          <div class="flex flex-nowrap gap-2">
            <el-button
              type="info"
              plain
              size="small"
              @click.stop="handleViewDetail(row)"
            >
              详细
            </el-button>
            <el-button
              type="warning"
              plain
              size="small"
              @click.stop="handleViewAuditRecords(row)"
            >
              记录
            </el-button>
            <el-button
              type="success"
              size="small"
              :disabled="isActionLocked(row.status)"
              @click.stop="handleApprove(row)"
            >
              通过
            </el-button>
            <el-button
              type="danger"
              size="small"
              :disabled="isActionLocked(row.status)"
              @click.stop="openRejectDialog(row)"
            >
              驳回
            </el-button>
          </div>
        </template>
      </MyTable>

      <LectureDetailDialog
        v-model="detailDialogVisible"
        :loading="detailLoading"
        :lecture="currentLecture"
      />

      <LectureAuditDialog
        v-model="auditDialogVisible"
        :lecture-id="currentAuditLecture?.id || ''"
        :lecture-title="currentAuditLecture?.title || ''"
      />

      <el-dialog
        v-model="rejectDialogVisible"
        title="驳回讲座"
        width="520px"
        destroy-on-close
      >
        <div class="space-y-4">
          <div class="text-sm text-gray-600">
            讲座：{{ rejectLectureTitle }}
          </div>
          <el-form label-position="top">
            <el-form-item label="驳回原因" required>
              <el-input
                v-model="rejectReason"
                type="textarea"
                :rows="4"
                maxlength="200"
                show-word-limit
                placeholder="请输入驳回原因"
              />
            </el-form-item>
          </el-form>
        </div>

        <template #footer>
          <el-button @click="rejectDialogVisible = false">取消</el-button>
          <el-button
            type="danger"
            :loading="rejectSubmitting"
            @click="submitReject"
          >
            确认驳回
          </el-button>
        </template>
      </el-dialog>
    </el-card>
  </div>
</template>

<style scoped>
.lecture-status-tag {
  border-radius: 9999px;
  padding: 0 10px;
  min-width: 76px;
  justify-content: center;
}
</style>
