<script setup lang="ts">
import PureTable, { LoadingConfig, PaginationProps } from "@pureadmin/table";
import { onMounted, reactive, ref, toRefs, useTemplateRef } from "vue";
import { Delete, Edit, CircleClose, Check } from "@element-plus/icons-vue";
import type { TableInstance } from "element-plus";

defineOptions({
  name: "MyTable"
});

interface MyTableProps {
  columns: any[];
  loading: boolean;
  showOverflowTooltip?: boolean;
  fetchData: () => void;
  handleView?: (row: any) => void; // 新增查看功能处理函数
  handleEdit?: (row: any) => void;
  pagination: any;
  handleDelete?: (row: any) => void;
  handleDisable?: (row: any) => void; // 停用功能处理函数
  handleEnable?: (row: any) => void; // 新增启用功能处理函数
  handleSortChange?: (sort: string, order: string) => void;
  handleSelectionChange?: (selection: any[]) => void;
  rowClickable?: boolean; // 新增行可点击属性
}
const props = defineProps<MyTableProps>();

defineModel("modelValue");

const { pagination } = toRefs(props);

const loadingConfig = reactive<LoadingConfig>({
  text: "正在加载第一页...",
  viewBox: "-10, -10, 50, 50",
  spinner: `
        <path class="path" d="
          M 30 15
          L 28 17
          M 25.61 25.61
          A 15 15, 0, 0, 1, 15 30
          A 15 15, 0, 1, 1, 27.99 7.5
          L 15 15
        " style="stroke-width: 4px; fill: rgba(0, 0, 0, 0)"/>
      `
  // svg: "",
  // background: rgba()
});

function onSizeChange(val) {
  loadingConfig.text = `正在加载第${pagination.value.currentPage}页...`;
  pagination.value.pageSize = val;
  props.fetchData();
}

function onCurrentChange(val) {
  loadingConfig.text = `正在加载第${val}页...`;
  pagination.value.currentPage = val;
  props.fetchData();
}

function onSortChange({ prop, order }) {
  if (props.handleSortChange) {
    loadingConfig.text = `正在加载...`;
    props.handleSortChange(prop, order);
  }
}

function onSelectionChange(val) {
  if (props.handleSelectionChange) {
    props.handleSelectionChange(val);
  }
}

type TableRefExtra = typeof PureTable & {
  getTableRef: () => TableInstance;
};

const tableRef = useTemplateRef<TableRefExtra>("tableRef");

const exportTableRef = function (): TableRefExtra {
  return tableRef.value;
};

defineExpose({
  exportTableRef
});
// 行点击处理函数
function handleRowClick(row) {
  if (props.rowClickable && props.handleView) {
    props.handleView(row);
  }
}
</script>

<template>
  <pure-table
    ref="tableRef"
    :loading="loading"
    fit
    table-layout="auto"
    row-key="id"
    adaptive
    :header-cell-style="{
      background: 'var(--el-fill-color-light)',
      color: 'var(--el-text-color-primary)'
    }"
    :data="modelValue"
    :columns="columns"
    :pagination="pagination"
    :loading-config="loadingConfig"
    :showOverflowTooltip="showOverflowTooltip"
    :row-class-name="rowClickable ? 'cursor-pointer' : ''"
    @page-size-change="onSizeChange"
    @page-current-change="onCurrentChange"
    @sort-change="onSortChange"
    @selection-change="onSelectionChange"
    @row-click="handleRowClick"
  >
    <template #empty>
      <el-empty v-if="!loading" description="啥也没有喔" />
    </template>
    <template #id="{ row }">
      <slot name="customId" :row="row">
        <el-empty description="啥也没有喔" />
      </slot>
    </template>
    <template #operation="{ row }">
      <slot name="customOperation" :row="row">
        <div class="flex w-full">
          <el-button
            v-if="handleEdit"
            type="primary"
            size="small"
            class="w-full"
            @click.stop="handleEdit(row)"
            >编辑</el-button
          >
          <el-popconfirm
            v-if="handleDelete"
            title="你确定要删除吗？"
            @confirm="handleDelete(row)"
          >
            <template #reference>
              <el-button type="danger" class="w-full" size="small" @click.stop
                >删除</el-button
              >
            </template>
          </el-popconfirm>
        </div>
      </slot>
    </template>
  </pure-table>
</template>

<style scoped></style>
