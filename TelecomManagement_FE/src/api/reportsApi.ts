import { apiGet } from "./http";
import { fromBackendFields } from "./backendFields";
import type { Device } from "./devicesApi";
import type { ErrorLog } from "./errorLogsApi";
import type { PerformanceRow } from "./performanceApi";

const API_PREFIX = "/qlmvt";

export type KpiRow = Record<string, unknown>;
export type CapacityRow = { LoaiTB: string; SoLuong: number };
export type UptimeRow = PerformanceRow;
export type StatusRow = { TrangThai: string; SoLuong: number };
export type VulnerabilityMapRow = {
  TenTB: string;
  CriticalCount: number;
  HighCount: number;
  MediumCount: number;
  LowCount: number;
};
export type ErrorSeverityRow = { MucDo: string; SoLuongSuCo: number };
export type VulnerabilityStatusRow = { TrangThai: string; SoLuong: number };
export type TopEmployeeRow = {
  MaNV: number;
  HoTen: string;
  TongSoSuCo: number;
  DaXuLy: number;
  DangXuLy: number;
};
export type ErrorTrendRow = {
  Ngay: string;
  TongSoSuCo: number;
  Critical: number;
  High: number;
};
export type MonthlyIncidentRow = {
  Thang: string;
  TenTB: string;
  SoSuCo: number;
};

export type BackendDashboardSummary = {
  nhan_vien: number;
  thiet_bi: number;
  lien_ket: number;
  chi_so_hieu_suat: number;
  nhat_ky_loi: { tong: number; da_xu_ly: number; chua_xu_ly: number };
  lo_hong: { tong: number; da_va: number; chua_va: number; dang_xu_ly: number };
};

const getErrorLogs = async (): Promise<ErrorLog[]> =>
  fromBackendFields<ErrorLog[]>(
    await apiGet<unknown>(`${API_PREFIX}/api_get_ds_nkl/`),
  );

const getDevices = async (): Promise<Device[]> =>
  fromBackendFields<Device[]>(
    await apiGet<unknown>(`${API_PREFIX}/api_get_ds_tb/`),
  );

export async function getKpi(): Promise<KpiRow[]> {
  return fromBackendFields<KpiRow[]>(
    await apiGet<unknown>(`${API_PREFIX}/api_get_kpi_nhan_vien`),
  );
}

export async function getCapacityReport(): Promise<CapacityRow[]> {
  const devices = await getDevices();
  const counts = new Map<string, number>();
  for (const device of devices) {
    const type = device.LoaiTB || "Khác";
    counts.set(type, (counts.get(type) ?? 0) + 1);
  }
  return [...counts].map(([LoaiTB, SoLuong]) => ({ LoaiTB, SoLuong }));
}

export async function getUptimeReport(): Promise<UptimeRow[]> {
  return fromBackendFields<UptimeRow[]>(
    await apiGet<unknown>(`${API_PREFIX}/api_get_ds_cshs/`),
  );
}

export function getKpiMonthlyRanking(rows: KpiRow[]): KpiRow[] {
  return rows
    .slice()
    .sort(
      (a, b) =>
        Number(b.TongDaXuLy ?? 0) - Number(a.TongDaXuLy ?? 0) ||
        String(a.HoTen ?? "").localeCompare(String(b.HoTen ?? ""), "vi"),
    )
    .map((row, index) => ({ ...row, ThuHang: index + 1 }));
}

export async function getStatusDistribution(): Promise<StatusRow[]> {
  const summary = await apiGet<BackendDashboardSummary>(
    `${API_PREFIX}/api_get_bao_cao_tong_quan`,
  );
  return [
    { TrangThai: "Đã xử lý", SoLuong: summary.nhat_ky_loi.da_xu_ly },
    { TrangThai: "Chưa xử lý", SoLuong: summary.nhat_ky_loi.chua_xu_ly },
  ];
}

export async function getVulnerabilityMap(): Promise<VulnerabilityMapRow[]> {
  const rows = await apiGet<Array<{
    ten_tb: string;
    muc_do: { critical: number; high: number; medium: number; low: number };
  }>>(`${API_PREFIX}/api_get_lo_hong_theo_thiet_bi`);
  return rows.map((row) => ({
    TenTB: row.ten_tb,
    CriticalCount: row.muc_do.critical,
    HighCount: row.muc_do.high,
    MediumCount: row.muc_do.medium,
    LowCount: row.muc_do.low,
  }));
}

export async function getErrorSeverity(): Promise<ErrorSeverityRow[]> {
  const logs = await getErrorLogs();
  const counts = new Map<string, number>();
  for (const log of logs) {
    const severity = String(log.MucDoNghiemTrong ?? "Không xác định");
    counts.set(severity, (counts.get(severity) ?? 0) + 1);
  }
  return [...counts].map(([MucDo, SoLuongSuCo]) => ({ MucDo, SoLuongSuCo }));
}

export async function getVulnerabilityStatus(): Promise<VulnerabilityStatusRow[]> {
  const summary = await apiGet<{
    da_va: number;
    chua_va: number;
    dang_xu_ly: number;
  }>(`${API_PREFIX}/api_get_tinh_trang_lo_hong`);
  return [
    { TrangThai: "Đã vá", SoLuong: summary.da_va },
    { TrangThai: "Chưa vá", SoLuong: summary.chua_va },
    { TrangThai: "Đang xử lý", SoLuong: summary.dang_xu_ly },
  ];
}

export async function getTopEmployees(): Promise<TopEmployeeRow[]> {
  const rows = await apiGet<Array<{
    ma_nv: number;
    ho_ten: string;
    su_co: { tong: number; da_xu_ly: number; dang_xu_ly: number };
  }>>(`${API_PREFIX}/api_get_tong_loi_nv_xu_ly`);
  return rows.map((row) => ({
    MaNV: row.ma_nv,
    HoTen: row.ho_ten,
    TongSoSuCo: row.su_co.tong,
    DaXuLy: row.su_co.da_xu_ly,
    DangXuLy: row.su_co.dang_xu_ly,
  }));
}

export async function getErrorTrend(): Promise<ErrorTrendRow[]> {
  const logs = await getErrorLogs();
  const counts = new Map<string, ErrorTrendRow>();
  for (const log of logs) {
    const day = log.ThoiGianLoi?.slice(0, 10);
    if (!day) continue;
    const row = counts.get(day) ?? {
      Ngay: day,
      TongSoSuCo: 0,
      Critical: 0,
      High: 0,
    };
    row.TongSoSuCo += 1;
    const severity = String(log.MucDoNghiemTrong).toLowerCase();
    if (severity.includes("critical") || severity.includes("nghiêm trọng")) {
      row.Critical += 1;
    }
    if (severity.includes("high") || severity.includes("cao")) {
      row.High += 1;
    }
    counts.set(day, row);
  }
  return [...counts.values()].sort((a, b) => a.Ngay.localeCompare(b.Ngay));
}

export async function getMonthlyIncidentHistory(): Promise<MonthlyIncidentRow[]> {
  const logs = await getErrorLogs();
  const devices = await getDevices();
  const namesById = new Map(devices.map((device) => [device.MaTB, device.TenTB]));
  const counts = new Map<string, MonthlyIncidentRow>();
  for (const log of logs) {
    const month = log.ThoiGianLoi?.slice(0, 7);
    if (!month) continue;
    const TenTB = log.TenTB || namesById.get(log.MaTB) || `Thiết bị ${log.MaTB}`;
    const key = `${month}:${TenTB}`;
    const row = counts.get(key) ?? { Thang: month, TenTB, SoSuCo: 0 };
    row.SoSuCo += 1;
    counts.set(key, row);
  }
  return [...counts.values()];
}
