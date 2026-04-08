import { ref, reactive } from "vue";
import { ElMessage } from "element-plus";
import { getRoleList } from "@/api/role";

/**
 * 成员管理页面搜索功能钩子
 * @param fetchMemberList 获取成员列表的回调函数
 */
export function useSearch(fetchMemberList: () => void) {
  // 搜索配置
  const searchConfig = ref({
    nickname: "", // 昵称
    phone: "", // 手机号
    email: "" // 邮箱
  });

  // 角色配置
  const roleIds = ref<string[]>([]);
  const roleOptions = ref<Array<{ id: string; name: string }>>([]);
  const loadingRoles = ref(false);

  // 成员状态过滤
  const statusFilter = ref("all"); // 'all', 'active', 'disable'

  // 排序配置
  const sortConfig = reactive({
    prop: "updateTime",
    order: "desc"
  });

  // 获取角色列表
  const fetchRoleOptions = async () => {
    loadingRoles.value = true;
    try {
      const res = await getRoleList({ page: 1, size: 300 });
      if (res.code === 200) {
        roleOptions.value = (res.data.records || []).map(role => ({
          id: role.roleName,
          name: role.roleDescription || role.roleName
        }));
      }
    } catch (error) {
      console.error("获取角色列表失败:", error);
      ElMessage.error("获取角色列表失败");
    } finally {
      loadingRoles.value = false;
    }
  };

  // 重置搜索条件
  const resetSearch = () => {
    searchConfig.value.nickname = "";
    searchConfig.value.phone = "";
    searchConfig.value.email = "";
    roleIds.value = [];
    statusFilter.value = "all";
    sortConfig.prop = "updateTime";
    sortConfig.order = "desc";
    fetchMemberList();
  };

  // 处理排序变化
  const sortChange = (prop: string, order: string) => {
    sortConfig.prop = prop;
    sortConfig.order = order === "ascending" ? "asc" : "desc";
    fetchMemberList();
  };

  // 构建查询参数
  const getQueryParams = () => {
    const params: any = {
      roleIds: roleIds.value.length > 0 ? roleIds.value : undefined,
      status: statusFilter.value !== "all" ? statusFilter.value : undefined,
      sort: sortConfig.prop,
      order: sortConfig.order
    };

    // 添加搜索字段
    if (searchConfig.value.nickname) {
      params.nickname = searchConfig.value.nickname;
    }

    if (searchConfig.value.phone) {
      params.phone = searchConfig.value.phone;
    }

    if (searchConfig.value.email) {
      params.email = searchConfig.value.email;
    }

    // 移除undefined值
    Object.keys(params).forEach(
      key => params[key] === undefined && delete params[key]
    );

    return params;
  };

  return {
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
  };
}
