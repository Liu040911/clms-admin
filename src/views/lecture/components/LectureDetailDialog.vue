<script setup lang="ts">
import { computed } from "vue";
import dayjs from "dayjs";
import type { LectureBO } from "@/api/lecture";

defineOptions({
  name: "LectureDetailDialog"
});

interface Props {
  modelValue: boolean;
  loading?: boolean;
  lecture: LectureBO | null;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
});

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
}>();

const dialogVisible = computed({
  get: () => props.modelValue,
  set: value => emit("update:modelValue", value)
});

const statusTextMap: Record<string, string> = {
  draft: "草稿",
  pending: "待审核",
  reject: "已驳回",
  published: "已发布",
  finished: "已结束",
  cancelled: "已取消"
};

const statusTagType = computed(
  (): "success" | "warning" | "info" | "danger" => {
    const status = props.lecture?.status;
    if (status === "published") return "success";
    if (status === "pending") return "warning";
    if (status === "reject") return "danger";
    if (status === "cancelled") return "danger";
    return "info";
  }
);

const introParagraphs = computed(() => {
  return (props.lecture?.description || "").split("\n").filter(Boolean);
});

const formatTime = (value?: string) => {
  if (!value) return "-";
  return dayjs(value).isValid()
    ? dayjs(value).format("YYYY-MM-DD HH:mm")
    : value;
};
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    title="讲座详情"
    width="780px"
    destroy-on-close
  >
    <div v-loading="loading" class="lecture-detail-dialog">
      <el-empty v-if="!loading && !lecture" description="暂无讲座详情数据" />

      <template v-else-if="lecture">
        <el-card shadow="never" class="mb-4">
          <template #header>
            <div class="flex items-center justify-between">
              <div class="text-base font-semibold">讲座详情</div>
              <el-tag :type="statusTagType" effect="light">
                {{
                  statusTextMap[lecture.status] || lecture.status || "未知状态"
                }}
              </el-tag>
            </div>
          </template>

          <div class="cover-wrapper mb-4">
            <el-image
              :src="lecture.coverImageUrl"
              fit="cover"
              class="cover-image"
            >
              <template #error>
                <div class="image-placeholder">暂无封面</div>
              </template>
            </el-image>
          </div>

          <div class="text-xl font-semibold mb-2">
            {{ lecture.title || "-" }}
          </div>
          <div class="text-sm text-gray-500 mb-4">
            主讲人：{{ lecture.teacherName || lecture.teacherId || "-" }}
          </div>

          <div v-if="(lecture.tags || []).length" class="mb-4 flex flex-wrap gap-2">
            <el-tag
              v-for="tag in lecture.tags || []"
              :key="tag.id"
              type="success"
              effect="plain"
            >
              {{ tag.name }}
            </el-tag>
          </div>

          <div class="intro-panel mb-4">
            <div class="section-title">讲座内容</div>
            <p
              v-for="(paragraph, index) in introParagraphs"
              :key="index"
              class="paragraph"
            >
              {{ paragraph }}
            </p>
            <p v-if="introParagraphs.length === 0" class="paragraph">-</p>
          </div>

          <div class="time-panel mb-4">
            <div class="section-title">时间与地点</div>
            <p>
              报名时间：{{ formatTime(lecture.registrationStartsTime) }} ~
              {{ formatTime(lecture.registrationEndsTime) }}
            </p>
            <p>
              讲座时间：{{ formatTime(lecture.lectureStartTime) }} ~
              {{ formatTime(lecture.lectureEndTime) }}
            </p>
            <p>地址：{{ lecture.location || "-" }}</p>
          </div>

          <div v-if="lecture.status === 'reject'" class="reject-panel mb-4">
            <div class="section-title text-red-600">驳回原因</div>
            <p class="reject-text">{{ lecture.reason || "未填写驳回原因" }}</p>
          </div>

          <div class="remaining-panel">
            剩余可报名人数：{{ lecture.remaining ?? 0 }} 人
          </div>
        </el-card>
      </template>
    </div>

    <template #footer>
      <el-button @click="dialogVisible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.lecture-detail-dialog {
  min-height: 240px;
}

.cover-wrapper {
  border-radius: 12px;
  overflow: hidden;
  background: #f3f4f6;
}

.cover-image {
  display: block;
  width: 100%;
  height: 260px;
}

.image-placeholder {
  width: 100%;
  height: 260px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  background: #f3f4f6;
}

.section-title {
  margin-bottom: 10px;
  font-size: 15px;
  font-weight: 600;
  color: #111827;
}

.intro-panel {
  border-radius: 12px;
  background: #f3f4f6;
  padding: 14px 16px;
}

.paragraph {
  margin: 0 0 8px;
  line-height: 1.75;
  color: #4b5563;
}

.paragraph:last-child {
  margin-bottom: 0;
}

.time-panel {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 14px 16px;
  color: #374151;
  line-height: 1.9;
}

.time-panel p {
  margin: 0;
}

.remaining-panel {
  border-radius: 12px;
  background: #eff6ff;
  color: #1d4ed8;
  padding: 14px 16px;
}

.reject-panel {
  border-radius: 12px;
  background: #fef2f2;
  padding: 14px 16px;
}

.reject-text {
  margin: 0;
  color: #b91c1c;
  line-height: 1.75;
}
</style>
