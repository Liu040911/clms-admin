import { http } from "@/utils/http";
import { BASE_URL } from "./types";

/**
 * 成员基础信息类型
 */
export type MemberInfo = {
  id: string;
  name: string;
  nickname: string;
  email: string;
  phone: string;
  avatar?: string;
  gender?: string;
  dob?: string;
  createTime: string;
  updateTime: string;
};

/**
 * 成员详细信息类型
 */
export type MemberBO = {
  id: string;
  memberInfo: MemberInfo;
  department?: {
    id: string;
    departmentName: string;
  };
  position?: {
    id: string;
    positionName: string;
  };
  roles?: Array<{
    id: string;
    roleName: string;
    roleDescription?: string;
  }>;
  status: string; // 'active' | 'disable'
  createTime: string;
  updateTime: string;
};

/**
 * 成员创建/更新 DTO
 */
export type MemberDTO = {
  userId?: string;
  name?: string;
  nickname?: string;
  password?: string;
  email?: string;
  phone?: string;
  gender?: string;
  dob?: string;
  departmentId?: string;
  positionId?: string;
  roleIds?: boolean;
  status?: string;
};

/**
 * 成员查询参数
 */
export type MemberQueryParams = {
  page: number;
  size: number;
  sort?: string;
  order?: string;
  name?: string;
  nickname?: string;
  phone?: string;
  email?: string;
  departmentId?: string;
  positionId?: string;
  roleIds?: string[];
  status?: string;
};

/**
 * 分页数据类型
 */
export type PageData<T> = {
  records: T[];
  total: number;
  pages: number;
  pageSize: number;
  currentPage: number;
};

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

export type AdminUserInfo = {
  id: string;
  username?: string;
  nickname?: string;
  avatar?: string;
  phone?: string;
  email?: string;
  gender?: string;
  roles?: string[];
  permissions?: string[];
  createTime?: string;
  updateTime?: string;
};

/**
 * 获取成员列表
 */
export const getMemberList = (params: MemberQueryParams) => {
  return http.request<ApiResponse<BackendPage<AdminUserInfo>>>(
    "get",
    BASE_URL + "/admin/getAdminList",
    {
      params: {
        pageNum: params.page,
        pageSize: params.size
      }
    }
  );
};

/**
 * 创建成员
 */
export const createMember = (data: MemberDTO) => {
  return http.request<ApiResponse<null>>("post", BASE_URL + "/admin/addAdmin", {
    data
  });
};

/**
 * 更新成员
 */
export const updateMember = (id: string, data: MemberDTO) => {
  return http.request<ApiResponse<null>>(
    "post",
    BASE_URL + "/admin/editAdminInfo",
    {
      data: {
        userId: id,
        ...data
      }
    }
  );
};

/**
 * 获取管理员角色选项
 */
export const getMemberRoleOptions = () => {
  return http.request<ApiResponse<BackendPage<AdminUserInfo>>>(
    "get",
    BASE_URL + "/admin/getAdminList",
    {
      params: {
        pageNum: 1,
        pageSize: 300
      }
    }
  );
};

/**
 * 删除成员
 */
export const deleteMember = (id: string) => {
  const _id = id;
  return new Promise<{ code: number; data: string }>(resolve => {
    setTimeout(() => {
      resolve({
        code: 200,
        data: "成员删除成功"
      });
    }, 300);
  });
};

/**
 * 启用成员
 */
export const enableMember = (id: string) => {
  return http.request<ApiResponse<null>>(
    "post",
    BASE_URL + "/admin/enableAdminPermission",
    {
      params: {
        userId: id
      }
    }
  );
};

/**
 * 停用成员
 */
export const disableMember = (id: string) => {
  return http.request<ApiResponse<null>>(
    "post",
    BASE_URL + "/admin/disableAdminPermission",
    {
      params: {
        userId: id
      }
    }
  );
};
