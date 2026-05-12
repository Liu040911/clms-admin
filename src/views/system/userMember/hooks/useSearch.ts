import { ref, reactive, computed } from "vue";
import { ElMessage } from "element-plus";
import { getRoleList } from "@/api/role";

export function useSearch(fetchMemberList: () => void) {
  const searchConfig = ref({
    nickname: "",
    phone: "",
    email: ""
  });

  const roleIds = ref<string[]>([]);
  const roleOptions = ref<Array<{ id: string; name: string }>>([]);
  const loadingRoles = ref(false);

  const statusFilter = ref("all");

  const sortConfig = reactive({
    prop: "updateTime",
    order: "desc"
  });

  const fetchRoleOptions = async () => {
    loadingRoles.value = true;
    try {
      const res = await getRoleList({ page: 1, size: 300 });
      if (res.code === 200) {
        roleOptions.value = (res.data.records || [])
          .filter(
            role =>
              role.roleName !== "admin" && role.roleName !== "superadmin"
          )
          .map(role => ({
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

  const sortChange = (prop: string, order: string) => {
    sortConfig.prop = prop;
    sortConfig.order = order === "ascending" ? "asc" : "desc";
    fetchMemberList();
  };

  const roleNameMap = computed(() => {
    const map: Record<string, string> = {};
    roleOptions.value.forEach(opt => {
      map[opt.id] = opt.name;
    });
    return map;
  });

  const getQueryParams = () => {
    const params: any = {
      roleIds: roleIds.value.length > 0 ? roleIds.value : undefined,
      status: statusFilter.value !== "all" ? statusFilter.value : undefined,
      sort: sortConfig.prop,
      order: sortConfig.order
    };

    if (searchConfig.value.nickname) {
      params.nickname = searchConfig.value.nickname;
    }
    if (searchConfig.value.phone) {
      params.phone = searchConfig.value.phone;
    }
    if (searchConfig.value.email) {
      params.email = searchConfig.value.email;
    }

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
    roleNameMap,
    sortConfig,
    fetchRoleOptions,
    resetSearch,
    sortChange,
    getQueryParams
  };
}
