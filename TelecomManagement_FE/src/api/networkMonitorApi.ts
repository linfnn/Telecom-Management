import { ApiError } from "./http";
import {
  createDevice,
  getDevices,
  toggleDevicePower as updatePower,
  updateDevice,
} from "./devicesApi";
import type { Link } from "./linksApi";
import { apiPost } from "./http";
import type { ApiSuccessEnvelope } from "./types";

const LAYOUT_KEY = "qlmvt-network-map-layout";
const API_PREFIX = "/qlmvt";

export type MonitorDevice = {
  MaMonitor: number;
  MaTB: number;
  TenTB: string;
  LoaiTB: string;
  DiaChiIP: string;
  ViTri: string;
  PowerState: "ON" | "OFF" | "UNKNOWN";
  MonitorState: string;
  PingLatencyMs: number | null;
  PingSampleLossPercent: number | null;
  PingStatusMessage: string;
  LatestMetricTime: string | null;
  LatestLatencyMs: number | null;
  LatestPacketLossPercent: number | null;
  LatestBandwidthUsage: number | null;
  CPUPercent: number | null;
  RAMPercent: number | null;
  LastSeen: string | null;
  Temperature?: number | null;
  UptimeSeconds?: number | null;
  AttackType?: string;
  ToaDoX?: number;
  ToaDoY?: number;
  CoSuCo?: boolean;
  TinhTrang?: string;
  TrangThai?: string;
  UnresolvedCount?: number;
};

export type MonitorLink = Omit<Link, "MaTB_Goc" | "MaTB_Dich"> & {
  MaTB_Goc: number | null;
  MaTB_Dich: number | null;
  TrangThai: string;
  MonitorState: string;
  StatusReason: string;
};

export type NetworkTopologyResponse = {
  success: boolean;
  serverTime: string;
  devices: MonitorDevice[];
  links: MonitorLink[];
};

export type IpValidationResponse = {
  code: "INVALID_FORMAT" | "DUPLICATE" | "OK";
  valid: boolean;
  compatible: boolean;
  message?: string;
  normalizedIp?: string;
};

export type DiagnosticsResponse = {
  success: boolean;
  healthy: boolean;
  status: string;
  checkedAt: string;
  checks: Array<{ label: string; detail: string; ok: boolean; warning: boolean }>;
  message?: string;
};

function readLayout(): Record<string, { x: number; y: number }> {
  const raw = window.localStorage.getItem(LAYOUT_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, { x: number; y: number }>;
  } catch {
    window.localStorage.removeItem(LAYOUT_KEY);
    return {};
  }
}

function writeLayout(layout: Record<string, { x: number; y: number }>): void {
  window.localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout));
}

export async function validateDeviceIp(
  deviceId: number | string,
  ip: string,
): Promise<IpValidationResponse> {
  const normalizedIp = ip.trim();
  const parts = normalizedIp.split(".");
  const validFormat =
    parts.length === 4 &&
    parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255);
  if (!validFormat) {
    return {
      code: "INVALID_FORMAT",
      valid: false,
      compatible: false,
      message: "Địa chỉ IPv4 không hợp lệ.",
    };
  }
  const devices = await getDevices();
  const duplicate = devices.some(
    (device) =>
      Number(device.MaTB) !== Number(deviceId) &&
      device.DiaChiIP === normalizedIp,
  );
  return duplicate
    ? {
        code: "DUPLICATE",
        valid: false,
        compatible: false,
        message: "Địa chỉ IP đã được thiết bị khác sử dụng.",
      }
    : {
        code: "OK",
        valid: true,
        compatible: true,
        normalizedIp,
      };
}

export async function applyDeviceIp(
  deviceId: number | string,
  payload: { ip: string; acceptSubnetWarning: boolean },
): Promise<ApiSuccessEnvelope> {
  void payload.acceptSubnetWarning;
  const device = (await getDevices()).find(
    (item) => Number(item.MaTB) === Number(deviceId),
  );
  if (!device) throw new ApiError("Không tìm thấy thiết bị.", 404, undefined);
  return updateDevice(deviceId, { ...device, DiaChiIP: payload.ip });
}

export async function runDeviceDiagnostics(
  deviceId: number | string,
): Promise<DiagnosticsResponse> {
  return apiPost<DiagnosticsResponse>(
    `${API_PREFIX}/api_network_diagnostics/${deviceId}/`,
    {},
  );
}

export async function updateDeviceProfile(
  deviceId: number | string,
  payload: { name: string; location: string },
): Promise<ApiSuccessEnvelope> {
  const device = (await getDevices()).find(
    (item) => Number(item.MaTB) === Number(deviceId),
  );
  if (!device) throw new ApiError("Không tìm thấy thiết bị.", 404, undefined);
  return updateDevice(deviceId, {
    ...device,
    TenTB: payload.name,
    ViTri: payload.location,
  });
}

export function createMonitorDevice(
  payload: Record<string, unknown>,
): Promise<ApiSuccessEnvelope> {
  return createDevice({
    TenTB: String(payload.name ?? ""),
    LoaiTB: String(payload.kind ?? "Thiết bị"),
    DiaChiIP: String(payload.ip ?? ""),
    ViTri: String(payload.location ?? ""),
    TrangThai: payload.power === "OFF" ? "Dự phòng" : "Hoạt động",
    TinhTrang: "Tốt",
  });
}

export function updateDevicePosition(
  deviceId: number | string,
  payload: { x: number; y: number },
): Promise<ApiSuccessEnvelope> {
  const layout = readLayout();
  layout[String(deviceId)] = payload;
  writeLayout(layout);
  return Promise.resolve({ success: true, message: "Đã lưu bố cục trên trình duyệt." });
}

export async function toggleDevicePower(
  deviceId: number | string,
  power: "ON" | "OFF",
): Promise<ApiSuccessEnvelope> {
  return updatePower(Number(deviceId), {
    TrangThai: power === "ON" ? "Hoạt động" : "Dự phòng",
  });
}

export function updateMonitorLinkStatus(
  id: number | string,
  status: string,
): Promise<ApiSuccessEnvelope> {
  void id;
  void status;
  return Promise.reject(
    new ApiError(
      "Backend hiện chỉ hỗ trợ tạo và xóa liên kết, chưa có API đổi trạng thái liên kết.",
      0,
      undefined,
    ),
  );
}

export function getNetworkMapLayout(): Promise<Array<{ id: string; x: number; y: number }>> {
  return Promise.resolve(
    Object.entries(readLayout()).map(([id, position]) => ({ id, ...position })),
  );
}

export function saveNetworkMapLayout(
  id: number | string,
  layout: { x: number; y: number },
): Promise<ApiSuccessEnvelope> {
  return updateDevicePosition(id, layout);
}

export function resetNetworkMapLayout(): Promise<ApiSuccessEnvelope> {
  window.localStorage.removeItem(LAYOUT_KEY);
  return Promise.resolve({ success: true, message: "Đã đặt lại bố cục bản đồ." });
}
