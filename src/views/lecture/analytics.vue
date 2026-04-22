<script setup lang="ts">
import type {
  LectureAnalyticsOverviewBO,
  LectureAnalyticsTagTopBO,
  LectureAnalyticsTrendPointBO
} from "@/api/lecture";
import {
  getLectureAnalyticsOverview,
  getLectureAnalyticsTagTop,
  getLectureAnalyticsTrend
} from "@/api/lecture";
import { ElMessage } from "element-plus";
import dayjs from "dayjs";
import * as echarts from "echarts";
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from "vue";

defineOptions({
  name: "LectureAnalytics"
});

const loading = ref(false);
const dateRange = ref<[Date, Date]>([
  dayjs().subtract(30, "day").toDate(),
  dayjs().toDate()
]);
const metric = ref<"registration" | "checkin" | "lectureCount">("registration");
const granularity = ref<"day" | "week" | "month">("day");

const overview = reactive<LectureAnalyticsOverviewBO>({
  totalLectures: 0,
  publishedLectures: 0,
  pendingLectures: 0,
  rejectedLectures: 0,
  finishedLectures: 0,
  cancelledLectures: 0,
  totalRegistrations: 0,
  totalCheckIns: 0,
  totalCancelledRegistrations: 0,
  checkInRate: 0,
  cancelRate: 0,
  avgAttendanceRate: 0
});

const trendData = ref<LectureAnalyticsTrendPointBO[]>([]);
const tagTopData = ref<LectureAnalyticsTagTopBO[]>([]);

const trendRef = ref<HTMLDivElement | null>(null);
const statusRef = ref<HTMLDivElement | null>(null);
const tagTopRef = ref<HTMLDivElement | null>(null);
let trendChart: echarts.ECharts | null = null;
let statusChart: echarts.ECharts | null = null;
let tagTopChart: echarts.ECharts | null = null;

const kpiCards = computed(() => {
  return [
    { label: "讲座总数", value: overview.totalLectures },
    { label: "已发布", value: overview.publishedLectures },
    { label: "待审核", value: overview.pendingLectures },
    { label: "总报名", value: overview.totalRegistrations },
    { label: "总签到", value: overview.totalCheckIns },
    { label: "签到率", value: `${overview.checkInRate.toFixed(2)}%` },
    { label: "取消率", value: `${overview.cancelRate.toFixed(2)}%` },
    { label: "平均上座率", value: `${overview.avgAttendanceRate.toFixed(2)}%` }
  ];
});

const metricLabelMap: Record<string, string> = {
  registration: "报名热度",
  checkin: "签到热度",
  lectureCount: "讲座数量"
};

const toDateTimeString = (date: Date, end = false) => {
  return dayjs(date)
    .hour(end ? 23 : 0)
    .minute(end ? 59 : 0)
    .second(end ? 59 : 0)
    .format("YYYY-MM-DD HH:mm:ss");
};

const buildCommonParams = () => {
  const [start, end] = dateRange.value;
  return {
    startTime: toDateTimeString(start),
    endTime: toDateTimeString(end, true)
  };
};

const initCharts = () => {
  if (trendRef.value && !trendChart) {
    trendChart = echarts.init(trendRef.value);
  }
  if (statusRef.value && !statusChart) {
    statusChart = echarts.init(statusRef.value);
  }
  if (tagTopRef.value && !tagTopChart) {
    tagTopChart = echarts.init(tagTopRef.value);
  }
};

const renderStatusChart = () => {
  if (!statusChart) return;
  statusChart.setOption({
    tooltip: { trigger: "item" },
    legend: { bottom: 0 },
    series: [
      {
        type: "pie",
        radius: ["45%", "70%"],
        data: [
          { name: "已发布", value: overview.publishedLectures },
          { name: "待审核", value: overview.pendingLectures },
          { name: "已驳回", value: overview.rejectedLectures },
          { name: "已结束", value: overview.finishedLectures },
          { name: "已取消", value: overview.cancelledLectures }
        ]
      }
    ]
  });
};

const renderTrendChart = () => {
  if (!trendChart) return;
  trendChart.setOption({
    tooltip: { trigger: "axis" },
    legend: {
      data: ["创建", "发布", "报名", "签到", "取消"]
    },
    grid: { left: 20, right: 20, bottom: 30, containLabel: true },
    xAxis: {
      type: "category",
      data: trendData.value.map(item => item.time)
    },
    yAxis: { type: "value" },
    series: [
      {
        name: "创建",
        type: "line",
        smooth: true,
        data: trendData.value.map(item => item.createdCount)
      },
      {
        name: "发布",
        type: "line",
        smooth: true,
        data: trendData.value.map(item => item.publishedCount)
      },
      {
        name: "报名",
        type: "line",
        smooth: true,
        data: trendData.value.map(item => item.registrationCount)
      },
      {
        name: "签到",
        type: "line",
        smooth: true,
        data: trendData.value.map(item => item.checkInCount)
      },
      {
        name: "取消",
        type: "line",
        smooth: true,
        data: trendData.value.map(item => item.cancelCount)
      }
    ]
  });
};

const renderTagTopChart = () => {
  if (!tagTopChart) return;
  tagTopChart.setOption({
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    grid: { left: 20, right: 20, bottom: 10, containLabel: true },
    xAxis: { type: "value" },
    yAxis: {
      type: "category",
      data: tagTopData.value.map(item => item.tagName)
    },
    series: [
      {
        type: "bar",
        data: tagTopData.value.map(item => item.metricValue),
        label: { show: true, position: "right" }
      }
    ]
  });
};

const fetchAll = async () => {
  loading.value = true;
  try {
    const params = buildCommonParams();
    const [overviewRes, trendRes, tagTopRes] = await Promise.all([
      getLectureAnalyticsOverview(params),
      getLectureAnalyticsTrend({ ...params, granularity: granularity.value }),
      getLectureAnalyticsTagTop({ ...params, metric: metric.value, topN: 10 })
    ]);

    if (overviewRes.code !== 200 || trendRes.code !== 200 || tagTopRes.code !== 200) {
      throw new Error(overviewRes.msg || trendRes.msg || tagTopRes.msg || "获取分析数据失败");
    }

    Object.assign(overview, overviewRes.data);
    trendData.value = trendRes.data || [];
    tagTopData.value = tagTopRes.data || [];

    await nextTick();
    initCharts();
    renderStatusChart();
    renderTrendChart();
    renderTagTopChart();
  } catch (error) {
    console.error("获取讲座分析数据失败:", error);
    ElMessage.error("获取讲座分析数据失败");
  } finally {
    loading.value = false;
  }
};

const handleResize = () => {
  trendChart?.resize();
  statusChart?.resize();
  tagTopChart?.resize();
};

onMounted(async () => {
  await fetchAll();
  window.addEventListener("resize", handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", handleResize);
  trendChart?.dispose();
  statusChart?.dispose();
  tagTopChart?.dispose();
});
</script>

<template>
  <div class="lecture-analytics-page">
    <el-card shadow="never" class="mb-4">
      <div class="toolbar">
        <div class="title">讲座数据分析</div>
        <div class="filters">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            unlink-panels
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
          />
          <el-select v-model="granularity" style="width: 120px">
            <el-option label="按日" value="day" />
            <el-option label="按周" value="week" />
            <el-option label="按月" value="month" />
          </el-select>
          <el-select v-model="metric" style="width: 140px">
            <el-option label="报名热度" value="registration" />
            <el-option label="签到热度" value="checkin" />
            <el-option label="讲座数量" value="lectureCount" />
          </el-select>
          <el-button type="primary" :loading="loading" @click="fetchAll">刷新数据</el-button>
        </div>
      </div>

      <div class="kpi-grid">
        <div v-for="item in kpiCards" :key="item.label" class="kpi-item">
          <div class="kpi-label">{{ item.label }}</div>
          <div class="kpi-value">{{ item.value }}</div>
        </div>
      </div>
    </el-card>

    <div class="chart-grid">
      <el-card shadow="never" class="chart-card">
        <template #header>讲座状态分布</template>
        <div ref="statusRef" class="chart-box" />
      </el-card>

      <el-card shadow="never" class="chart-card wide">
        <template #header>讲座趋势分析（{{ metricLabelMap[metric] }}）</template>
        <div ref="trendRef" class="chart-box" />
      </el-card>

      <el-card shadow="never" class="chart-card wide">
        <template #header>标签热度 Top10（{{ metricLabelMap[metric] }}）</template>
        <div ref="tagTopRef" class="chart-box" />
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.lecture-analytics-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.title {
  font-size: 16px;
  font-weight: 600;
}

.filters {
  display: flex;
  align-items: center;
  gap: 10px;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.kpi-item {
  background: #f8fafc;
  border-radius: 8px;
  padding: 10px 12px;
}

.kpi-label {
  color: #64748b;
  font-size: 13px;
}

.kpi-value {
  color: #0f172a;
  font-size: 20px;
  font-weight: 700;
  margin-top: 4px;
}

.chart-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.chart-card.wide {
  grid-column: span 2;
}

.chart-box {
  height: 360px;
}
</style>
