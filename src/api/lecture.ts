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

export type LectureTagBO = {
  id: string;
  name: string;
  description?: string;
  type?: string;
  icon?: string;
};

export type LectureBO = {
  id: string;
  title: string;
  description: string;
  coverImageUrl: string;
  teacherId?: string;
  teacherName?: string;
  registrationStartsTime: string;
  registrationEndsTime: string;
  lectureStartTime: string;
  lectureEndTime: string;
  remaining?: number;
  status: string;
  reason?: string;
  classId?: string;
  location?: string;
  tags?: LectureTagBO[];
  createTime?: string;
  updateTime?: string;
};

export type LectureAuditBO = {
  id: string;
  lectureId: string;
  lectureTitle: string;
  auditAction: string;
  beforeStatus: string;
  afterStatus: string;
  reason?: string;
  auditorId: string;
  auditorName?: string;
  createTime?: string;
  updateTime?: string;
};

export type LectureDTO = {
  title: string;
  description: string;
  coverImageUrl: string;
  registrationStartsTime: string;
  registrationEndsTime: string;
  lectureStartTime: string;
  lectureEndTime: string;
  teacherId?: string;
  status?: string;
  classId?: string;
};

export type LectureQueryParams = {
  title?: string;
  status?: string;
  teacherId?: string;
  page: number;
  size: number;
  sort?: string;
  order?: "asc" | "desc";
};

export type LectureAuditQueryParams = {
  lectureId: string;
  page: number;
  size: number;
};

export const getLectureList = (params: LectureQueryParams) => {
  return http.request<ApiResponse<BackendPage<LectureBO>>>(
    "get",
    BASE_URL + "/lecture/list",
    {
      params
    }
  );
};

export const getLectureInfo = (lectureId: string) => {
  return http.request<ApiResponse<LectureBO>>(
    "get",
    BASE_URL + "/lecture/info",
    {
      params: {
        lectureId
      }
    }
  );
};

export const updateLecture = (lectureId: string, data: LectureDTO) => {
  return http.request<ApiResponse<void>>("post", BASE_URL + "/lecture/update", {
    params: {
      lectureId
    },
    data
  });
};

export const approveLecture = (lectureId: string) => {
  return http.request<ApiResponse<void>>(
    "post",
    BASE_URL + "/lecture/approve",
    {
      params: {
        lectureId
      }
    }
  );
};

export const rejectLecture = (lectureId: string, reason: string) => {
  return http.request<ApiResponse<void>>("post", BASE_URL + "/lecture/reject", {
    params: {
      lectureId,
      reason
    }
  });
};

export const getLectureAuditList = (params: LectureAuditQueryParams) => {
  return http.request<ApiResponse<BackendPage<LectureAuditBO>>>(
    "get",
    BASE_URL + "/lecture/audit/list",
    {
      params
    }
  );
};
