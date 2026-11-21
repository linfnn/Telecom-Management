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

export type Vulnerability = {
  MaLH: number;
  MaTB: number;
  TenTB?: string;
  TenLoHong: string;
  MucDo: string;
  TrangThaiKhacPhuc: string;
  MaNV_XuLy?: number | null;
  HoTenXuLy?: string;
  ThoiGianXayRaSuCo?: string;
  ThoiGianXuLySuCo?: string | null;
  [key: string]: unknown;
};

export type CreateVulnerabilityRequest = {
  MaTB: string | number;
  TenLoHong: string;
  MucDo: string;
  TrangThaiKhacPhuc: string;
  MaNV_XuLy?: string | number | null;
  ThoiGianXayRaSuCo: string;
  ThoiGianXuLySuCo?: string | null;
};

export type UpdateVulnerabilityAssigneeRequest = {
  MaNV_XuLy: string | number | null;
};

export type UpdateVulnerabilityStatusRequest = {
  TrangThaiKhacPhuc: string;
};

export function getVulnerabilities(
  context: UserContext,
): Promise<Vulnerability[]> {
  return Promise.all([
    apiGet<unknown>(`${API_PREFIX}/api_get_ds_lh/`),
    getDevices(),
    context.requesterRole === "Admin" ? getEmployees() : Promise.resolve([]),
  ]).then(([data, devices, employees]) => {
    const deviceNames = new Map(devices.map((device) => [device.MaTB, device.TenTB]));
    const employeeNames = new Map(employees.map((employee) => [employee.MaNV, employee.HoTen]));
    return fromBackendFields<Vulnerability[]>(data).map((vulnerability) => ({
      ...vulnerability,
      TenTB: deviceNames.get(vulnerability.MaTB),
      HoTenXuLy: employeeNames.get(Number(vulnerability.MaNV_XuLy)),
    }));
  });
}

export function createVulnerability(
  payload: CreateVulnerabilityRequest,
): Promise<ApiSuccessEnvelope> {
  return apiPost<unknown>(
    `${API_PREFIX}/api_create_lh/`,
    toBackendFields(payload),
  ).then((data) => successResponse<ApiSuccessEnvelope>(data, "Tạo lỗ hổng thành công"));
}

export function deleteVulnerability(
  vulnerabilityId: number,
): Promise<ApiSuccessEnvelope> {
  return apiDelete<unknown>(
    `${API_PREFIX}/api_delete_lh/${vulnerabilityId}/`,
  ).then((data) => successResponse<ApiSuccessEnvelope>(data, "Xóa lỗ hổng thành công"));
}

export function updateVulnerabilityAssignee(
  vulnerabilityId: number,
  payload: UpdateVulnerabilityAssigneeRequest,
): Promise<ApiSuccessEnvelope> {
  return apiPut<unknown>(
    `${API_PREFIX}/api_update_lh/${vulnerabilityId}/`,
    toBackendFields(payload),
  ).then((data) => successResponse<ApiSuccessEnvelope>(data, "Cập nhật người xử lý thành công"));
}

export function updateVulnerabilityStatus(
  vulnerabilityId: number,
  payload: UpdateVulnerabilityStatusRequest,
): Promise<ApiSuccessEnvelope> {
  return apiPut<unknown>(
    `${API_PREFIX}/api_update_lh/${vulnerabilityId}/`,
    toBackendFields(payload),
  ).then((data) => successResponse<ApiSuccessEnvelope>(data, "Cập nhật trạng thái lỗ hổng thành công"));
}

export function exportVulnerabilitiesJson(
  context: UserContext,
): Promise<Blob> {
  void context;
  return apiGetBlob(`${API_PREFIX}/api_export_table/lohong`);
}

export function importVulnerabilitiesJson(
  file: File,
  context: UserContext,
): Promise<ApiSuccessEnvelope> {
  void context;
  const formData = new FormData();
  formData.append("file", file);
  return apiPostFormData<unknown>(
    `${API_PREFIX}/api_import_table/lohong`,
    formData,
  ).then((data) => successResponse<ApiSuccessEnvelope>(data, "Nhập dữ liệu lỗ hổng thành công"));
}
