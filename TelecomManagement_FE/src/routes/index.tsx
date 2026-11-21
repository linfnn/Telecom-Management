import { createBrowserRouter } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { ProtectedRoute } from "./ProtectedRoute";
import { PublicRoute } from "./PublicRoute";

const Role = {
  ADMIN: "Admin",
  TECHNICIAN: "Technician",
  SUPERVISOR: "Supervisor",
} as const;
type Role = typeof Role[keyof typeof Role];

export const router = createBrowserRouter([
  // 1. PUBLIC ROUTES
  {
    element: <PublicRoute />,
    children: [
      {
        path: "/login",
        lazy: () =>
          import("../features/auth/LoginPage").then((module) => ({
            element: <module.default />,
          })),
      },
    ],
  },

  // 2. PROTECTED ROUTES
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          {
            path: "/",
            lazy: () =>
              import("../features/reports/DashboardPage").then((m) => ({
                element: <m.DashboardPage />,
              })),
          },
          {
            path: "/devices",
            lazy: () =>
              import("../features/devices/DevicesPage").then((m) => ({
                element: <m.DevicesPage />,
              })),
          },
          {
            path: "/devices/:id",
            lazy: () =>
              import("../features/devices/DeviceDetailPage").then((m) => ({
                element: <m.DeviceDetailPage />,
              })),
          },
          {
            path: "/links",
            lazy: () =>
              import("../features/devices/LinkDevicePage").then((m) => ({
                element: <m.LinkDevicePage />,
              })),
          },
          {
            path: "/system-performance",
            lazy: () =>
              import("../features/reports/SystemPerformancePage").then((m) => ({
                element: <m.SystemPerformancePage />,
              })),
          },
          {
            path: "/security",
            lazy: () =>
              import("../features/vulnerabilities/VulnerabilityManagementPage").then(
                (m) => ({ element: <m.VulnerabilityManagementPage /> }),
              ),
          },
          {
            path: "/error-logs",
            lazy: () =>
              import("../features/errorlogs/ErrorLogsPage").then((m) => ({
                element: <m.ErrorLogPage />,
              })),
          },
          {
            path: "/advanced-report",
            lazy: () =>
              import("../features/reports/AdvancedReportPage").then((m) => ({
                element: <m.AdvancedReportPage />,
              })),
          },
          {
            path: "/reports",
            lazy: () =>
              import("../features/reports/AdvancedReportPage").then((m) => ({
                element: <m.AdvancedReportPage />,
              })),
          },
          {
            element: <ProtectedRoute roles={[Role.ADMIN]} />,
            children: [
              {
                path: "/employees",
                lazy: () =>
                  import("../features/auth/EmployeeManagementPage").then(
                    (m) => ({
                      element: <m.EmployeeManagementPage />,
                    }),
                  ),
              },
              {
                path: "/kpi",
                lazy: () =>
                  import("../features/reports/TechnicalKpiPage").then((m) => ({
                    element: <m.TechnicalKpiPage />,
                  })),
              },
              {
                path: "/backup",
                lazy: () =>
                  import("../features/auth/DatabaseMaintenancePage").then(
                    (m) => ({
                      element: <m.DatabaseMaintenancePage />,
                    }),
                  ),
              },
            ],
          },
        ],
      },
    ],
  },

  // 3. 404 NOT FOUND ROUTE
  {
    path: "*",
    element: <div>404 - Page Not Found</div>,
  },
]);
