import { apiDelete, apiGet, apiPost } from "./http";
import type { ApiSuccessEnvelope } from "./types";
import { fromBackendFields, successResponse, toBackendFields } from "./backendFields";

const API_PREFIX = "/qlmvt";

export type Employee = {
  MaNV: number;
  HoTen: string;
  Email: string;
  SoDienThoai?: string;
  ChuyenMon?: string;
  VaiTro: string;
  [key: string]: unknown;
};

export type CreateEmployeeRequest = {
  HoTen: string;
  Email: string;
  SoDienThoai: string;
  ChuyenMon: string;
  VaiTro: string;
};

export function getEmployees(): Promise<Employee[]> {
  return apiGet<unknown>(`${API_PREFIX}/api_get_ds_nv/`).then((data) =>
    fromBackendFields<Employee[]>(data),
  );
}

export function createEmployee(
  payload: CreateEmployeeRequest,
): Promise<ApiSuccessEnvelope> {
  return apiPost<unknown>(
    `${API_PREFIX}/api_create_nv/`,
    toBackendFields(payload),
  ).then((data) => successResponse<ApiSuccessEnvelope>(data, "Tạo nhân viên thành công"));
}

export function deleteEmployee(
  employeeId: number,
): Promise<ApiSuccessEnvelope> {
  return apiDelete<unknown>(
    `${API_PREFIX}/api_delete_nv/${employeeId}/`,
  ).then((data) => successResponse<ApiSuccessEnvelope>(data, "Đã xóa nhân viên"));
}
