<script setup lang="ts">
import MyTable from "@/components/myTable/MyTable.vue";
import { PaginationProps, type TableColumns } from "@pureadmin/table";
import {
  createTag,
  deleteTag,
  getTagList,
  updateTag,
  type TagBO,
  type TagDTO
} from "@/api/tag";
import { ElMessage, ElMessageBox, ElTag } from "element-plus";
import { Search, Plus } from "@element-plus/icons-vue";
import { h, onMounted, reactive, ref } from "vue";
import dayjs from "dayjs";

defineOptions({
  name: "TagManagePage"
});

const pageConfig = reactive({
  loading: false,
  tableData: [] as TagBO[]
});

const pagination = reactive<PaginationProps>({
  pageSize: 10,
  currentPage: 1,
  pageSizes: [10, 20, 50],
  total: 0,
  align: "right",
  background: true,
  size: "default"
});

const searchForm = reactive({
  tagName: "",
  tagType: "",
  tagStatus: ""
});

const formDialogVisible = ref(false);
const formSubmitting = ref(false);
const editingTagId = ref("");
const isEditMode = ref(false);

const formData = reactive<TagDTO>({
  tagName: "",
  tagDescription: "",
  tagType: "lecture",
  tagStatus: "draft",
  icon: "",
  isSystem: false
});

const lectureIconOptions = [
  { value: "teacher-talk", emoji: "🎤" },
  { value: "academic-salon", emoji: "💡" },
  { value: "college-special", emoji: "🏫" },
  { value: "research-share", emoji: "🧪" },
  { value: "career-guide", emoji: "💼" },
  { value: "signup-checkin", emoji: "📝" },
  { value: "postgraduate-plan", emoji: "📚" },
  { value: "career-navigation", emoji: "🧭" },
  { value: "competition-exp", emoji: "🏅" },
  { value: "more-lecture", emoji: "✨" }
];

const statusTextMap: Record<string, string> = {
  draft: "草稿",
  active: "启用",
  inactive: "停用"
};

const statusTypeMap: Record<string, "success" | "info" | "warning"> = {
  draft: "warning",
  active: "success",
  inactive: "info"
};

const tagTypeTextMap: Record<string, string> = {
  lecture: "讲座",
  user: "用户",
  common: "通用"
};

const formatTime = (value?: string) => {
  if (!value) return "-";
  return dayjs(value).isValid() ? dayjs(value).format("YYYY-MM-DD HH:mm") : value;
};

const resolveTagIconValue = (row: TagBO) => {
  if (row?.icon?.trim()) {
    return row.icon.trim();
  }

  if (!row?.metaData?.trim()) {
    return "";
  }

  try {
    const meta = JSON.parse(row.metaData);
    return typeof meta?.icon === "string" ? meta.icon.trim() : "";
  } catch {
    return "";
  }
};

const columns: TableColumns[] = [
  {
    label: "标签ID",
    prop: "id",
    minWidth: 220
  },
  {
    label: "标签名称",
    prop: "tagName",
    minWidth: 140
  },
  {
    label: "描述",
    prop: "tagDescription",
    minWidth: 180
  },
  {
    label: "标签类型",
    prop: "tagType",
    minWidth: 100,
    formatter: row => tagTypeTextMap[row.tagType] || row.tagType || "-"
  },
  {
    label: "图标",
    prop: "icon",
    minWidth: 90,
    formatter: row => {
      if (row.tagType !== "lecture") return "-";
      const iconValue = resolveTagIconValue(row);
      const option = lectureIconOptions.find(item => item.value === iconValue);
      return option?.emoji || iconValue || "-";
    }
  },
  {
    label: "状态",
    prop: "tagStatus",
    minWidth: 100,
    cellRenderer: scope => {
      const status = scope.row.tagStatus || "draft";
      return h(
        ElTag,
        {
          type: statusTypeMap[status] || "info",
          effect: "light"
        },
        () => statusTextMap[status] || status
      );
    }
  },
  {
    label: "系统标签",
    prop: "isSystem",
    minWidth: 90,
    formatter: row => (row.isSystem ? "是" : "否")
  },
  {
    label: "更新时间",
    prop: "updateTime",
    minWidth: 160,
    formatter: row => formatTime(row.updateTime)
  },
  {
    label: "操作",
    fixed: "right",
    width: 180,
    slot: "operation"
  }
];

const fetchTagList = () => {
  pageConfig.loading = true;
  getTagList({
    tagName: searchForm.tagName || undefined,
    tagType: (searchForm.tagType as "lecture" | "user" | "common") || undefined,
    tagStatus: (searchForm.tagStatus as "draft" | "active" | "inactive") || undefined,
    page: pagination.currentPage,
    size: pagination.pageSize,
    sort: "createTime",
    order: "desc"
  })
    .then(res => {
      if (res.code !== 200) {
        ElMessage.error(res.msg || "获取标签列表失败");
        return;
      }
      pageConfig.tableData = res.data.records || [];
      pagination.total = res.data.total || 0;
    })
    .catch(() => {
      ElMessage.error("获取标签列表失败");
    })
    .finally(() => {
      pageConfig.loading = false;
    });
};

const resetAndSearch = () => {
  pagination.currentPage = 1;
  fetchTagList();
};

const resetSearch = () => {
  searchForm.tagName = "";
  searchForm.tagType = "";
  searchForm.tagStatus = "";
  pagination.currentPage = 1;
  fetchTagList();
};

const resetForm = () => {
  formData.tagName = "";
  formData.tagDescription = "";
  formData.tagType = "lecture";
  formData.tagStatus = "draft";
  formData.icon = "";
  formData.isSystem = false;
  editingTagId.value = "";
};

const openCreateDialog = () => {
  isEditMode.value = false;
  resetForm();
  formDialogVisible.value = true;
};

const openEditDialog = (row: TagBO) => {
  isEditMode.value = true;
  editingTagId.value = row.id;
  formData.tagName = row.tagName;
  formData.tagDescription = row.tagDescription || "";
  formData.tagType = row.tagType || "lecture";
  formData.tagStatus = row.tagStatus || "draft";
  formData.icon = resolveTagIconValue(row);
  formData.isSystem = !!row.isSystem;
  formDialogVisible.value = true;
};

const validateForm = () => {
  if (!formData.tagName.trim()) {
    ElMessage.warning("请输入标签名称");
    return false;
  }
  if (!formData.tagType) {
    ElMessage.warning("请选择标签类型");
    return false;
  }
  if (formData.tagType === "lecture" && !formData.icon) {
    ElMessage.warning("讲座类型标签请选择图标");
    return false;
  }
  return true;
};

const submitForm = async () => {
  if (!validateForm()) {
    return;
  }

  formSubmitting.value = true;
  try {
    const lectureMetaData =
      formData.tagType === "lecture" && formData.icon
        ? JSON.stringify({ icon: formData.icon })
        : undefined;

    const payload: TagDTO = {
      tagName: formData.tagName.trim(),
      tagDescription: formData.tagDescription?.trim(),
      tagType: formData.tagType,
      tagStatus: formData.tagStatus,
      icon: formData.tagType === "lecture" ? formData.icon : "",
      metaData: lectureMetaData,
      isSystem: !!formData.isSystem
    };

    const res = isEditMode.value
      ? await updateTag(editingTagId.value, payload)
      : await createTag(payload);

    if (res.code !== 200) {
      ElMessage.error(res.msg || (isEditMode.value ? "修改标签失败" : "创建标签失败"));
      return;
    }

    ElMessage.success(isEditMode.value ? "修改成功" : "创建成功");
    formDialogVisible.value = false;
    fetchTagList();
  } catch {
    ElMessage.error(isEditMode.value ? "修改标签失败" : "创建标签失败");
  } finally {
    formSubmitting.value = false;
  }
};

const removeTag = async (row: TagBO) => {
  try {
    await ElMessageBox.confirm(`确认删除标签“${row.tagName}”吗？`, "删除确认", {
      type: "warning"
    });
  } catch {
    return;
  }

  try {
    const res = await deleteTag(row.id);
    if (res.code !== 200) {
      ElMessage.error(res.msg || "删除标签失败");
      return;
    }
    ElMessage.success("删除成功");
    fetchTagList();
  } catch {
    ElMessage.error("删除标签失败");
  }
};

onMounted(() => {
  fetchTagList();
});
</script>

<template>
  <div>
    <el-card shadow="never">
      <div class="mb-4 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <el-button type="primary" :icon="Plus" @click="openCreateDialog">
            新建标签
          </el-button>
        </div>

        <div class="flex items-center gap-2">
          <el-input
            v-model="searchForm.tagName"
            placeholder="搜索标签名称"
            style="width: 220px"
            clearable
            @keyup.enter="resetAndSearch"
          />
          <el-select
            v-model="searchForm.tagType"
            placeholder="类型"
            clearable
            style="width: 120px"
          >
            <el-option label="讲座" value="lecture" />
            <el-option label="用户" value="user" />
            <el-option label="通用" value="common" />
          </el-select>
          <el-select
            v-model="searchForm.tagStatus"
            placeholder="状态"
            clearable
            style="width: 120px"
          >
            <el-option label="草稿" value="draft" />
            <el-option label="启用" value="active" />
            <el-option label="停用" value="inactive" />
          </el-select>
          <el-button type="primary" :icon="Search" @click="resetAndSearch">
            查询
          </el-button>
          <el-button @click="resetSearch">重置</el-button>
        </div>
      </div>

      <MyTable
        v-model="pageConfig.tableData"
        :loading="pageConfig.loading"
        :columns="columns"
        :pagination="pagination"
        :fetch-data="fetchTagList"
        :row-clickable="false"
      >
        <template #customOperation="{ row }">
          <div class="flex flex-nowrap gap-2">
            <el-button type="primary" plain size="small" @click.stop="openEditDialog(row)">
              编辑
            </el-button>
            <el-button type="danger" plain size="small" @click.stop="removeTag(row)">
              删除
            </el-button>
          </div>
        </template>
      </MyTable>

      <el-dialog
        v-model="formDialogVisible"
        :title="isEditMode ? '编辑标签' : '新建标签'"
        width="560px"
        destroy-on-close
      >
        <el-form label-width="90px">
          <el-form-item label="标签名称" required>
            <el-input v-model="formData.tagName" maxlength="100" show-word-limit />
          </el-form-item>
          <el-form-item label="标签描述">
            <el-input v-model="formData.tagDescription" type="textarea" :rows="2" />
          </el-form-item>
          <el-form-item label="标签类型" required>
            <el-select v-model="formData.tagType" style="width: 100%">
              <el-option label="讲座" value="lecture" />
              <el-option label="用户" value="user" />
              <el-option label="通用" value="common" />
            </el-select>
          </el-form-item>
          <el-form-item v-if="formData.tagType === 'lecture'" label="图标库" required>
            <el-select v-model="formData.icon" style="width: 100%" placeholder="请选择讲座图标">
              <el-option
                v-for="item in lectureIconOptions"
                :key="item.value"
                :label="item.emoji"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-radio-group v-model="formData.tagStatus">
              <el-radio label="draft">草稿</el-radio>
              <el-radio label="active">启用</el-radio>
              <el-radio label="inactive">停用</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="系统标签">
            <el-switch v-model="formData.isSystem" />
          </el-form-item>
        </el-form>

        <template #footer>
          <el-button @click="formDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="formSubmitting" @click="submitForm">
            保存
          </el-button>
        </template>
      </el-dialog>
    </el-card>
  </div>
</template>
