import {
  apiDelete,
  apiGet,
  apiGetBlob,
  apiPost,
  apiPostFormData,
  apiPut,
} from "./http";
import type { ApiSuccessEnvelope, UserContext } from "./types";
import { fromBackendFields, successResponse, toBackendFields } from "./backendFields";
import { getDevices } from "./devicesApi";
import { getEmployees } from "./employeesApi";

const API_PREFIX = "/qlmvt";

export type ErrorLog = {
  MaLoi: number;
  MaTB: number;
  TenTB?: string;
  MoTaLoi: string;
  MucDoNghiemTrong: number | string;
  MaNV_XuLy?: number | null;
  HoTenXuLy?: string;
  DaXuLy: number;
  ThoiGianLoi?: string;
  ThoiGianHoanThanh?: string;
  [key: string]: unknown;
};

export type CreateErrorLogRequest = {
  MaTB: string | number;
  MoTaLoi: string;
  MucDoNghiemTrong: string | number;
  MaNV_XuLy?: string | number | null;
  DaXuLy: number;
};

export type UpdateErrorHandledRequest = {
  DaXuLy: number;
  MaNV_XuLy?: number;
  resolverEmail?: string;
  email?: string;
};

export type UpdateErrorAssigneeRequest = {
  MaNV_XuLy: string | number | null;
};

export function getErrorLogs(context: UserContext): Promise<ErrorLog[]> {
  return Promise.all([
    apiGet<unknown>(`${API_PREFIX}/api_get_ds_nkl/`),
    getDevices(),
    context.requesterRole === "Admin" ? getEmployees() : Promise.resolve([]),
  ]).then(([data, devices, employees]) => {
    const deviceNames = new Map(devices.map((device) => [device.MaTB, device.TenTB]));
    const employeeNames = new Map(employees.map((employee) => [employee.MaNV, employee.HoTen]));
    return fromBackendFields<ErrorLog[]>(data).map((log) => ({
      ...log,
      DaXuLy: Number(log.DaXuLy),
      TenTB: deviceNames.get(log.MaTB),
      HoTenXuLy: employeeNames.get(Number(log.MaNV_XuLy)),
    }));
  });
}

export function createErrorLog(
  payload: CreateErrorLogRequest,
): Promise<ApiSuccessEnvelope> {
  return apiPost<unknown>(
    `${API_PREFIX}/api_create_nkl/`,
    toBackendFields(payload),
  ).then((data) => successResponse<ApiSuccessEnvelope>(data, "Tạo nhật ký lỗi thành công"));
}

export function updateErrorHandled(
  errorLogId: number,
  payload: UpdateErrorHandledRequest,
): Promise<ApiSuccessEnvelope> {
  const body = {
    DaXuLy: Boolean(payload.DaXuLy),
  };
  return apiPut<unknown>(
    `${API_PREFIX}/api_update_nkl/${errorLogId}/`,
    toBackendFields(body),
  ).then((data) => successResponse<ApiSuccessEnvelope>(data, "Cập nhật nhật ký lỗi thành công"));
}

export function updateErrorAssignee(
  errorLogId: number,
  payload: UpdateErrorAssigneeRequest,
): Promise<ApiSuccessEnvelope> {
  return apiPut<unknown>(
    `${API_PREFIX}/api_phan_cong_nv_xuly_loi/${errorLogId}/`,
    toBackendFields(payload),
  ).then((data) => successResponse<ApiSuccessEnvelope>(data, "Phân công xử lý thành công"));
}

export function deleteErrorLog(
  errorLogId: number,
): Promise<ApiSuccessEnvelope> {
  return apiDelete<unknown>(
    `${API_PREFIX}/api_delete_nkl/${errorLogId}/`,
  ).then((data) => successResponse<ApiSuccessEnvelope>(data, "Xóa nhật ký lỗi thành công"));
}

export function exportErrorLogsJson(context: UserContext): Promise<Blob> {
  void context;
  return apiGetBlob(`${API_PREFIX}/api_export_table/nhatkyloi`);
}

export function importErrorLogsJson(
  file: File,
  context: UserContext,
): Promise<ApiSuccessEnvelope> {
  void context;
  const formData = new FormData();
  formData.append("file", file);
  return apiPostFormData<unknown>(
    `${API_PREFIX}/api_import_table/nhatkyloi`,
    formData,
  ).then((data) => successResponse<ApiSuccessEnvelope>(data, "Nhập nhật ký lỗi thành công"));
}
