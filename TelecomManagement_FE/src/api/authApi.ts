import { ApiError, apiGet, apiPost } from "./http";
import type { ApiSuccessEnvelope } from "./types";
import { fromBackendFields } from "./backendFields";

const API_PREFIX = "/qlmvt";

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginUser = {
  MaNV: number;
  HoTen: string;
  Email: string;
  VaiTro: "Admin" | "Technician";
  role: "admin" | "user";
};

export type LoginResponse = {
  success: true;
  user: LoginUser;
  token: string;
  refreshToken: string;
};

function unsupportedTwoFactor(): Promise<never> {
  return Promise.reject(
    new ApiError("Backend hiện chưa cung cấp API xác thực hai yếu tố.", 0, undefined),
  );
}

export function setup2faApi(): Promise<{
  secret: string;
  qr_code_url: string;
  recovery_codes: string[];
}> {
  return unsupportedTwoFactor();
}

export function verifySetup2faApi(_code: string): Promise<ApiSuccessEnvelope> {
  void _code;
  return unsupportedTwoFactor();
}

export function disable2faApi(
  _password: string,
  _code: string,
): Promise<ApiSuccessEnvelope> {
  void _password;
  void _code;
  return unsupportedTwoFactor();
}

export function verifyLogin2faApi(
  _uuid: string,
  _code: string,
): Promise<LoginResponse> {
  void _uuid;
  void _code;
  return unsupportedTwoFactor();
}

export async function loginApi(payload: LoginRequest): Promise<LoginResponse> {
  const response = await apiPost<{
    access_token: string;
    refresh_token: string;
    user: { ma_nv: number; ho_ten: string; email: string; role: "admin" | "user" };
  }, LoginRequest>(`${API_PREFIX}/api_login/`, payload);
  const account = response.user;
  return {
    success: true,
    token: response.access_token,
    refreshToken: response.refresh_token,
    user: {
      MaNV: account.ma_nv,
      HoTen: account.ho_ten,
      Email: account.email,
      VaiTro: account.role === "admin" ? "Admin" : "Technician",
      role: account.role,
    },
  };
}

export function logoutApi(): Promise<ApiSuccessEnvelope> {
  const refresh = window.localStorage.getItem("refreshToken");
  return apiPost<ApiSuccessEnvelope>(`${API_PREFIX}/api_logout/`, { refresh });
}

export type ChangePasswordRequest = {
  old_password: string;
  new_password: string;
};

export function changePasswordApi(
  payload: ChangePasswordRequest,
): Promise<ApiSuccessEnvelope> {
  return apiPost<ApiSuccessEnvelope>(
    `${API_PREFIX}/api_change_password/`,
    payload,
  );
}

export function refreshApi(
  refresh: string,
): Promise<{ access: string; refresh?: string }> {
  return apiPost<{ access: string; refresh?: string }>(
    `${API_PREFIX}/api_refresh_token/`,
    { refresh },
  );
}

export async function fetchMeApi(): Promise<LoginUser> {
  const response = await apiGet<{
    ma_nv: number;
    ho_ten: string;
    email: string;
    role: "admin" | "user";
  }>(`${API_PREFIX}/api_me/`);
  const account = fromBackendFields<{
    ma_nv: number;
    ho_ten: string;
    email: string;
    role: "admin" | "user";
  }>(response);
  return {
    MaNV: account.ma_nv,
    HoTen: account.ho_ten,
    Email: account.email,
    VaiTro: account.role === "admin" ? "Admin" : "Technician",
    role: account.role,
  };
}
