import { apiGet } from "./http";
import type { BackendDashboardSummary } from "./reportsApi";

const API_PREFIX = "/qlmvt";

export type DashboardSummary = {
  DeviceCount: number;
  OpenErrorCount: number;
  OpenVulnerabilityCount: number;
};

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const summary = await apiGet<BackendDashboardSummary>(
    `${API_PREFIX}/api_get_bao_cao_tong_quan`,
  );
  return {
    DeviceCount: summary.thiet_bi,
    OpenErrorCount: summary.nhat_ky_loi.chua_xu_ly,
    OpenVulnerabilityCount: summary.lo_hong.chua_va + summary.lo_hong.dang_xu_ly,
  };
}
