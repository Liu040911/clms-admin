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

export type LectureAnalyticsOverviewBO = {
  totalLectures: number;
  publishedLectures: number;
  pendingLectures: number;
  rejectedLectures: number;
  finishedLectures: number;
  cancelledLectures: number;
  totalRegistrations: number;
  totalCheckIns: number;
  totalCancelledRegistrations: number;
  checkInRate: number;
  cancelRate: number;
  avgAttendanceRate: number;
};

export type LectureAnalyticsTrendPointBO = {
  time: string;
  createdCount: number;
  publishedCount: number;
  registrationCount: number;
  checkInCount: number;
  cancelCount: number;
};

export type LectureAnalyticsTagTopBO = {
  tagId: string;
  tagName: string;
  metricValue: number;
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

export type LectureAnalyticsQueryParams = {
  startTime?: string;
  endTime?: string;
  teacherId?: string;
  tagId?: string;
  classId?: string;
};

export type LectureAnalyticsTrendQueryParams = {
  startTime?: string;
  endTime?: string;
  granularity?: "day" | "week" | "month";
  teacherId?: string;
  tagId?: string;
};

export type LectureAnalyticsTagTopQueryParams = {
  startTime?: string;
  endTime?: string;
  topN?: number;
  metric?: "registration" | "checkin" | "lectureCount";
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

export const getLectureAnalyticsOverview = (params: LectureAnalyticsQueryParams) => {
  return http.request<ApiResponse<LectureAnalyticsOverviewBO>>(
    "get",
    BASE_URL + "/lecture/analytics/overview",
    {
      params
    }
  );
};

export const getLectureAnalyticsTrend = (params: LectureAnalyticsTrendQueryParams) => {
  return http.request<ApiResponse<LectureAnalyticsTrendPointBO[]>>(
    "get",
    BASE_URL + "/lecture/analytics/trend",
    {
      params
    }
  );
};

export const getLectureAnalyticsTagTop = (params: LectureAnalyticsTagTopQueryParams) => {
  return http.request<ApiResponse<LectureAnalyticsTagTopBO[]>>(
    "get",
    BASE_URL + "/lecture/analytics/tag-top",
    {
      params
    }
  );
};
