import { ApiError } from "./http";

export interface SystemLog {
  id: number;
  time: string;
  category: string;
  user: string;
  action: string;
  target: string;
  ip: string;
  status: string;
  detail: unknown;
  raw: unknown;
}

export function getSystemLogs(): Promise<{ success: boolean; logs: SystemLog[] }> {
  return Promise.reject(
    new ApiError(
      "Backend hiện chưa cung cấp endpoint nhật ký kiểm toán.",
      0,
      undefined,
    ),
  );
}
