import type { InternalAxiosRequestConfig } from "axios";
import axiosClient from "./axiosClient";

let isInterceptorSetup = false;
let refreshRequest: Promise<string | null> | null = null;

const API_PREFIX = "/qlmvt";

function extractTokenFromStorage(): string | null {
  if (typeof window === "undefined") return null;

  const directTokenKeys = ["accessToken", "token", "authToken"];
  for (const key of directTokenKeys) {
    const token = window.localStorage.getItem(key);
    if (token) return token;
  }

  const userRaw = window.localStorage.getItem("user");
  if (!userRaw) return null;

  try {
    const user = JSON.parse(userRaw) as {
      accessToken?: string;
      token?: string;
      jwt?: string;
    };

    return user.accessToken ?? user.token ?? user.jwt ?? null;
  } catch {
    return null;
  }
}

export function setupInterceptors(): void {
  if (isInterceptorSetup) return;

  axiosClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = extractTokenFromStorage();

    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  });

  axiosClient.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      const requestUrl = String(originalRequest?.url ?? "");
      if (
        error.response?.status === 401 &&
        originalRequest &&
        !originalRequest._retry &&
        !requestUrl.includes("/api_login/") &&
        !requestUrl.includes("/api_refresh_token/")
      ) {
        originalRequest._retry = true;

        try {
          if (!refreshRequest) {
            const refreshToken = window.localStorage.getItem("refreshToken");
            if (!refreshToken) throw new Error("Missing refresh token");
            refreshRequest = axiosClient
              .post(`${API_PREFIX}/api_refresh_token/`, {
                refresh: refreshToken,
              })
              .then((response) => {
                const newAccessToken = response.data?.access;
                const newRefreshToken = response.data?.refresh;
                if (typeof newAccessToken !== "string") {
                  throw new Error("Refresh response did not contain an access token");
                }
                window.localStorage.setItem("accessToken", newAccessToken);
                if (typeof newRefreshToken === "string") {
                  window.localStorage.setItem("refreshToken", newRefreshToken);
                }
                return newAccessToken;
              })
              .catch(() => null)
              .finally(() => {
                refreshRequest = null;
              });
          }

          const newToken = await refreshRequest;

          if (newToken) {
            originalRequest.headers = originalRequest.headers ?? {};
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return axiosClient(originalRequest);
          }
        }
        catch (refreshError) {
          window.localStorage.removeItem("accessToken");
          window.localStorage.removeItem("refreshToken");
          window.localStorage.removeItem("user");
          window.location.assign("/login");
          return Promise.reject(refreshError);
        }

        window.localStorage.removeItem("accessToken");
        window.localStorage.removeItem("refreshToken");
        window.localStorage.removeItem("user");
        window.location.assign("/login");
      }

      return Promise.reject(error);
    }
  );

  isInterceptorSetup = true;
}
