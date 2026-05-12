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

export type UserMemberInfo = {
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

export type UserMemberDTO = {
  userId?: string;
  nickname?: string;
  password?: string;
  email?: string;
  phone?: string;
  gender?: string;
  avatarUrl?: string;
  roleIds?: string[];
};

export type UserMemberQueryParams = {
  page: number;
  size: number;
  sort?: string;
  order?: string;
  nickname?: string;
  phone?: string;
  email?: string;
  roleIds?: string[];
  status?: string;
};

export const getUserMemberList = (params: UserMemberQueryParams) => {
  return http.request<ApiResponse<BackendPage<UserMemberInfo>>>(
    "get",
    BASE_URL + "/admin/member/list",
    {
      params: {
        pageNum: params.page,
        pageSize: params.size
      }
    }
  );
};

export const editUserMember = (data: UserMemberDTO) => {
  return http.request<ApiResponse<null>>(
    "post",
    BASE_URL + "/admin/member/edit",
    {
      data
    }
  );
};

export const enableUserMember = (userId: string) => {
  return http.request<ApiResponse<null>>(
    "post",
    BASE_URL + "/admin/member/enable",
    {
      params: { userId }
    }
  );
};

export const disableUserMember = (userId: string) => {
  return http.request<ApiResponse<null>>(
    "post",
    BASE_URL + "/admin/member/disable",
    {
      params: { userId }
    }
  );
};
