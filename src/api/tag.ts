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

export type TagBO = {
  id: string;
  tagName: string;
  tagDescription?: string;
  tagType: "lecture" | "user" | "common";
  tagStatus: "draft" | "active" | "inactive";
  creatorId?: string;
  icon?: string;
  metaData?: string;
  isSystem?: boolean;
  createTime?: string;
  updateTime?: string;
};

export type TagDTO = {
  tagName: string;
  tagDescription?: string;
  tagType: "lecture" | "user" | "common";
  tagStatus?: "draft" | "active" | "inactive";
  icon?: string;
  metaData?: string;
  isSystem?: boolean;
};

export type TagQueryParams = {
  tagName?: string;
  tagType?: "lecture" | "user" | "common";
  tagStatus?: "draft" | "active" | "inactive";
  page: number;
  size: number;
  sort?: string;
  order?: "asc" | "desc";
};

export const getTagList = (params: TagQueryParams) => {
  return http.request<ApiResponse<BackendPage<TagBO>>>("get", BASE_URL + "/tag/list", {
    params
  });
};

export const getTagInfo = (tagId: string) => {
  return http.request<ApiResponse<TagBO>>("get", BASE_URL + "/tag/info", {
    params: {
      tagId
    }
  });
};

export const createTag = (data: TagDTO) => {
  return http.request<ApiResponse<void>>("post", BASE_URL + "/tag/create", {
    data
  });
};

export const updateTag = (tagId: string, data: TagDTO) => {
  return http.request<ApiResponse<void>>("post", BASE_URL + "/tag/update", {
    params: {
      tagId
    },
    data
  });
};

export const deleteTag = (tagId: string) => {
  return http.request<ApiResponse<void>>("post", BASE_URL + "/tag/delete", {
    params: {
      tagId
    }
  });
};
