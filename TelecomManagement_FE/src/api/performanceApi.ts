import { apiGet } from "./http";
import { fromBackendFields } from "./backendFields";
import { getDevices } from "./devicesApi";

const API_PREFIX = "/qlmvt";

export type PerformanceRow = {
  MaTB?: number;
  TenTB: string;
  DoTre?: number | string;
  MatGoi?: number | string;
  DoTreNum?: number | null;
  MatGoiNum?: number | null;
  [key: string]: unknown;
};

export function getPerformance(): Promise<PerformanceRow[]> {
  return Promise.all([
    apiGet<unknown>(`${API_PREFIX}/api_get_ds_cshs/`),
    getDevices(),
  ]).then(([data, devices]) => {
    const names = new Map(devices.map((device) => [device.MaTB, device.TenTB]));
    return fromBackendFields<PerformanceRow[]>(data).map((row) => ({
      ...row,
      TenTB: names.get(Number(row.MaTB)) ?? `Thiết bị ${row.MaTB}`,
    }));
  });
}
