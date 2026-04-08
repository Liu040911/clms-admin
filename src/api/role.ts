import { http } from "@/utils/http";
import { BASE_URL } from "./types";

export type ApiResponse<T> = {
  code: number;
  msg?: string;
  data: T;
};

export type BackendPage<T> = {
  records: T[];
  total: number;
  pages?: number;
  size: number;
  current: number;
};

export type PageData<T> = {
  records: T[];
  total: number;
  pages?: number;
  size: number;
  current: number;
};

export type RoleBO = {
  id: string;
  roleName: string;
  roleDescription: string;
  roleStatus: "active" | "disabled";
  createTime: string;
  updateTime: string;
  lastOperatorName?: string;
};

export type RoleDTO = {
  roleName: string;
  roleDescription: string;
  roleStatus: "active" | "disabled";
  defaultRole?: boolean;
};

export type SortConfig = {
  sort?: string;
  order?: "asc" | "desc";
};

export type PermissionBO = {
  id: string;
  permissionName: string;
  permissionString?: string;
};

export type PermissionModuleBO = {
  moduleName: string;
  permissions: PermissionBO[];
};

export type BatchPermissionUpdateRequest = {
  permissionsToBind?: string[];
  permissionsToUnbind?: string[];
};

export const getRoleList = (
  page: { page: number; size: number },
  roleName?: string,
  sort?: SortConfig
) => {
  return http.request<ApiResponse<BackendPage<RoleBO>>>(
    "get",
    BASE_URL + "/admin/role/list",
    {
      params: {
        page: page.page,
        size: page.size,
        roleName,
        sort: sort?.sort,
        order: sort?.order
      }
    }
  );
};

export const getRoleById = (id: string) => {
  return http.request<ApiResponse<RoleBO>>("get", BASE_URL + "/admin/role/info", {
    params: {
      roleId: id
    }
  });
};

export const createRole = (data: RoleDTO) => {
  return http.request<ApiResponse<null>>("post", BASE_URL + "/admin/role/create", {
    data
  });
};

export const updateRole = (id: string, data: RoleDTO) => {
  return http.request<ApiResponse<null>>("post", BASE_URL + "/admin/role/update", {
    params: {
      roleId: id
    },
    data
  });
};

export const deleteRole = (id: string) => {
  return http.request<ApiResponse<null>>("post", BASE_URL + "/admin/role/delete", {
    params: {
      roleId: id
    }
  });
};

export const bindPermissionToRole = (roleId: string, data: string[]) => {
  return http.request<ApiResponse<null>>(
    "post",
    BASE_URL + "/admin/role/bindPermission",
    {
      params: {
        roleId
      },
      data
    }
  );
};

export const unbindPermissionFromRole = (roleId: string, data: string[]) => {
  return http.request<ApiResponse<null>>(
    "post",
    BASE_URL + "/admin/role/unbindPermission",
    {
      params: {
        roleId
      },
      data
    }
  );
};

export const getRolePermissionList = (roleId: string) => {
  return http.request<ApiResponse<PermissionBO[]>>(
    "get",
    BASE_URL + "/admin/role/permissionList",
    {
      params: {
        roleId
      }
    }
  );
};

export const getPermissionModuleList = (roleId: string) => {
  return http.request<ApiResponse<PermissionModuleBO[]>>(
    "get",
    BASE_URL + "/admin/role/permissionModuleList",
    {
      params: {
        roleId
      }
    }
  );
};

export const getPermissionModules = (roleId: string) => {
  return http.request<ApiResponse<string[]>>(
    "get",
    BASE_URL + "/admin/role/permissionModules",
    {
      params: {
        roleId
      }
    }
  );
};

export const getAllPermissionModules = () => {
  return http.request<ApiResponse<PermissionModuleBO[]>>(
    "get",
    BASE_URL + "/admin/role/allPermissionModules"
  );
};

export const batchUpdateRolePermissions = (
  roleId: string,
  data: BatchPermissionUpdateRequest
) => {
  return http.request<ApiResponse<null>>(
    "post",
    BASE_URL + "/admin/role/batchUpdatePermissions",
    {
      params: {
        roleId
      },
      data
    }
  );
};
