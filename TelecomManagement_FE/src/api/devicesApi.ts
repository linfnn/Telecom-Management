import { apiDelete, apiGet, apiPost, apiPut } from "./http";
import type { ApiSuccessEnvelope } from "./types";
import { fromBackendFields, successResponse, toBackendFields } from "./backendFields";

const API_PREFIX = "/qlmvt";

export type Device = {
  MaTB: number;
  TenTB: string;
  DiaChiIP: string;
  LoaiTB: string;
  ViTri: string;
  TrangThai: string;
  CoSuCo?: boolean;
  TinhTrang?: string;
};

export type CreateDeviceRequest = {
  TenTB: string;
  DiaChiIP: string;
  LoaiTB: string;
  ViTri: string;
  TrangThai: string;
  TinhTrang?: string;
};

export type ToggleDevicePowerRequest = {
  TrangThai: string;
};

export function getDevices(): Promise<Device[]> {
  return apiGet<unknown>(`${API_PREFIX}/api_get_ds_tb/`).then((data) =>
    fromBackendFields<Device[]>(data),
  );
}

export function createDevice(
  payload: CreateDeviceRequest,
): Promise<ApiSuccessEnvelope> {
  const body = {
    ...payload,
    TinhTrang: payload.TinhTrang ?? "Tốt",
  };
  return apiPost<unknown>(`${API_PREFIX}/api_create_tb/`, toBackendFields(body))
    .then((data) => successResponse<ApiSuccessEnvelope>(data, "Tạo thiết bị thành công"));
}

export function toggleDevicePower(
  deviceId: number,
  payload: ToggleDevicePowerRequest,
): Promise<ApiSuccessEnvelope> {
  return apiGet<unknown>(`${API_PREFIX}/api_get_tb/${deviceId}/`).then(
    (rawDevice) => {
      const device = fromBackendFields<Device>(rawDevice);
      return updateDevice(deviceId, {
        ...device,
        TrangThai: payload.TrangThai,
      });
    },
  );
}

export function updateDevice(
  deviceId: number | string,
  payload: Omit<Device, "MaTB">,
): Promise<ApiSuccessEnvelope> {
  return apiPut<unknown>(
    `${API_PREFIX}/api_update_tb/${deviceId}/`,
    toBackendFields(payload),
  ).then((data) =>
    successResponse<ApiSuccessEnvelope>(data, "Cập nhật thiết bị thành công"),
  );
}

export function deleteDevice(deviceId: number): Promise<ApiSuccessEnvelope> {
  return apiDelete<unknown>(`${API_PREFIX}/api_delete_tb/${deviceId}/`).then(
    (data) => successResponse<ApiSuccessEnvelope>(data, "Xóa thiết bị thành công"),
  );
}

export type DeviceDetail = {
  success: boolean;
  device: {
    MaTB: number;
    TenTB: string;
    LoaiTB: string;
    DiaChiIP: string;
    ViTri: string;
    TrangThai: string;
    TinhTrang: string;
    DiaChiMAC: string | null;
    Firmware: string | null;
    NhaSanXuat: string | null;
    Model: string | null;
    SerialNumber: string | null;
    NgayCaiDat: string | null;
    MetadataSource: string | null;
    LanCuoiOnline: string | null;
    LatestLatency: number | null;
    LatestPacketLoss: number | null;
    LatestBandwidth: number | null;
    CPUPercent: number | null;
    RAMPercent: number | null;
    NhietDoC: number | null;
    LatestSource: string | null;
    UptimePercent: number | null;
  };
  history: {
    MaCS: number;
    MaTB: number;
    ThoiGianGhiNhan: string;
    DoTre: number | null;
    MatGoi: number | null;
    BangThongSuDung: number | null;
    CPUPercent: number | null;
    RAMPercent: number | null;
    NhietDoC: number | null;
    NguonDuLieu: string | null;
  }[];
  incidents: {
    MaLoi: number;
    MaTB: number;
    ThoiGianLoi: string;
    MoTaLoi: string;
    MucDoNghiemTrong: string;
    DaXuLy: number;
    ThoiGianHoanThanh: string | null;
    HoTenXuLy: string | null;
  }[];
  vulnerabilities: {
    MaLH: number;
    MaTB: number;
    TenLoHong: string;
    MucDo: string;
    TrangThaiKhacPhuc: string;
    ThoiGianXayRaSuCo: string;
    ThoiGianXuLySuCo: string | null;
    HoTenXuLy: string | null;
  }[];
  linksCount: number;
  timeline: {
    id: number;
    time: string;
    category: string;
    user: string;
    action: string;
    target: string;
    status: string;
    detail: unknown;
  }[];
  serverTime: string;
};

export async function getDeviceDetail(
  deviceId: number | string,
): Promise<DeviceDetail> {
  const [rawDevice, rawPerformance, rawIncidents, rawVulnerabilities, rawLinks] =
    await Promise.all([
      apiGet<unknown>(`${API_PREFIX}/api_get_tb/${deviceId}/`),
      apiGet<unknown>(`${API_PREFIX}/api_get_ds_cshs/`),
      apiGet<unknown>(`${API_PREFIX}/api_get_ds_nkl/`),
      apiGet<unknown>(`${API_PREFIX}/api_get_ds_lh/`),
      apiGet<unknown>(`${API_PREFIX}/api_get_ds_lk/`),
    ]);
  const device = fromBackendFields<Device>(rawDevice);
  const history = fromBackendFields<DeviceDetail["history"]>(rawPerformance)
    .filter((row) => Number(row.MaTB) === Number(deviceId))
    .sort((a, b) =>
      String(a.ThoiGianGhiNhan ?? "").localeCompare(
        String(b.ThoiGianGhiNhan ?? ""),
      ),
    );
  const incidents = fromBackendFields<DeviceDetail["incidents"]>(rawIncidents)
    .filter((row) => Number(row.MaTB) === Number(deviceId))
    .map((row) => ({ ...row, DaXuLy: Number(row.DaXuLy) }));
  const vulnerabilities = fromBackendFields<DeviceDetail["vulnerabilities"]>(
    rawVulnerabilities,
  ).filter((row) => Number(row.MaTB) === Number(deviceId));
  const links = fromBackendFields<Array<{ MaTB_Goc: number; MaTB_Dich: number }>>(
    rawLinks,
  ).filter(
    (link) =>
      Number(link.MaTB_Goc) === Number(deviceId) ||
      Number(link.MaTB_Dich) === Number(deviceId),
  );
  const latest = history.at(-1);
  const detail = {
    ...device,
    TinhTrang: device.TinhTrang ?? "Không xác định",
    DiaChiMAC: null,
    Firmware: null,
    NhaSanXuat: null,
    Model: null,
    SerialNumber: null,
    NgayCaiDat: null,
    MetadataSource: null,
    LanCuoiOnline: latest?.ThoiGianGhiNhan ?? null,
    LatestLatency: latest?.DoTre ?? null,
    LatestPacketLoss: latest?.MatGoi ?? null,
    LatestBandwidth: latest?.BangThongSuDung ?? null,
    CPUPercent: null,
    RAMPercent: null,
    NhietDoC: null,
    LatestSource: null,
    UptimePercent: null,
  };
  return {
    success: true,
    device: detail,
    history,
    incidents,
    vulnerabilities,
    linksCount: links.length,
    timeline: [],
    serverTime: new Date().toISOString(),
  };
}
