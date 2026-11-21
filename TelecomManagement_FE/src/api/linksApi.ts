import { apiDelete, apiGet, apiPost } from "./http";
import type { ApiSuccessEnvelope } from "./types";
import { fromBackendFields, successResponse, toBackendFields } from "./backendFields";
import { getDevices } from "./devicesApi";

const API_PREFIX = "/qlmvt";

export type Link = {
  MaLK: number;
  MaTB_Goc: number;
  MaTB_Dich: number;
  TenTB_Goc?: string;
  TenTB_Dich?: string;
  BangThongToiDa: number;
  MaNV_Tao?: number | null;
  NguoiTao?: string;
};

export type CreateLinkRequest = {
  MaTB_Goc: string | number;
  MaTB_Dich: string | number;
  BangThongToiDa: number;
  MaNV_Tao?: number | null;
};

export function getLinksApi(): Promise<Link[]> {
  return Promise.all([
    apiGet<unknown>(`${API_PREFIX}/api_get_ds_lk/`),
    getDevices(),
  ]).then(([data, devices]) => {
    const names = new Map(devices.map((device) => [device.MaTB, device.TenTB]));
    return fromBackendFields<Link[]>(data).map((link) => ({
      ...link,
      TenTB_Goc: names.get(link.MaTB_Goc),
      TenTB_Dich: names.get(link.MaTB_Dich),
    }));
  });
}

export function createLinkApi(
  payload: CreateLinkRequest,
): Promise<ApiSuccessEnvelope> {
  return apiPost<unknown>(
    `${API_PREFIX}/api_create_lk/`,
    toBackendFields(payload),
  ).then((data) => successResponse<ApiSuccessEnvelope>(data, "Tạo liên kết thành công"));
}

export function deleteLinkApi(linkId: number): Promise<ApiSuccessEnvelope> {
  return apiDelete<unknown>(`${API_PREFIX}/api_delete_lk/${linkId}/`).then(
    (data) => successResponse<ApiSuccessEnvelope>(data, "Xóa liên kết thành công"),
  );
}

export function disconnectLinkApi(linkId: number): Promise<ApiSuccessEnvelope> {
  return deleteLinkApi(linkId);
}
