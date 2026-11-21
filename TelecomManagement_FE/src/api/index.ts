import { setupInterceptors } from "./interceptors";

export * as authApi from "./authApi";
export { default as axiosClient } from "./axiosClient";
export * as backupApi from "./backupApi";
export { API_BASE_URL } from "./config.ts";
export * as dashboardApi from "./dashboardApi";
export * as devicesApi from "./devicesApi";
export * as employeesApi from "./employeesApi";
export * as errorLogsApi from "./errorLogsApi";
export * from "./http";
export * as linksApi from "./linksApi";
export * as performanceApi from "./performanceApi";
export * as reportsApi from "./reportsApi";
export * from "./types";
export * as vulnerabilitiesApi from "./vulnerabilitiesApi";
export { setupInterceptors };

setupInterceptors();
