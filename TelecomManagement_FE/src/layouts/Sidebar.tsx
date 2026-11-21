import {
  ApartmentOutlined,
  AppstoreOutlined,
  BarChartOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  DesktopOutlined,
  LineChartOutlined,
  NodeIndexOutlined,
  SafetyOutlined,
  SettingOutlined,
  TeamOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { Layout, Menu, Typography } from "antd";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/useTheme";
import { useAuth } from "../features/auth";

const { Sider } = Layout;
const { Title, Text } = Typography;

const Role = {
  ADMIN: "Admin",
  TECHNICIAN: "Technician",
  SUPERVISOR: "Supervisor",
} as const;
type Role = typeof Role[keyof typeof Role];

type SidebarMenuItem = {
  key: string;
  icon: ReactNode;
  label: string;
  roles: Role[];
  children?: SidebarMenuItem[];
};

const filterMenuItems = (
  items: SidebarMenuItem[],
  role: Role | undefined,
): SidebarMenuItem[] =>
  items.flatMap((item) => {
    if (!role || !item.roles.includes(role)) return [];
    if (!item.children) return [item];

    const children = filterMenuItems(item.children, role);
    return children.length > 0 ? [{ ...item, children }] : [];
  });

const getParentKeys = (
  items: SidebarMenuItem[],
  targetKey: string,
): string[] | null => {
  for (const item of items) {
    if (item.key === targetKey) return [];
    if (item.children) {
      const childResult = getParentKeys(item.children, targetKey);
      if (childResult) return [item.key, ...childResult];
    }
  }
  return null;
};

export function Sidebar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { dark } = useTheme();
  const { user } = useAuth();

  const [collapsed, setCollapsed] = useState(false);
  const [manualOpenKeys, setManualOpenKeys] = useState<string[] | null>(null);

  const pathSegments = location.pathname.split("/").filter(Boolean);
  const selectedKey = pathSegments.length > 0 ? pathSegments[0] : "dashboard";

  const menuItems = useMemo<SidebarMenuItem[]>(
    () => [
      {
        key: "dashboard",
        icon: <DashboardOutlined />,
        label: t("sidebar.dashboard"),
        roles: [Role.ADMIN, Role.TECHNICIAN, Role.SUPERVISOR],
      },
      {
        key: "network-group",
        icon: <ApartmentOutlined />,
        label: t("sidebar.groups.network"),
        roles: [Role.ADMIN, Role.TECHNICIAN, Role.SUPERVISOR],
        children: [
          {
            key: "devices",
            icon: <DesktopOutlined />,
            label: t("sidebar.devices"),
            roles: [Role.ADMIN, Role.TECHNICIAN, Role.SUPERVISOR],
          },
          {
            key: "links",
            icon: <NodeIndexOutlined />,
            label: t("sidebar.link_devices"),
            roles: [Role.ADMIN, Role.TECHNICIAN, Role.SUPERVISOR],
          },
        ],
      },
      {
        key: "monitoring-group",
        icon: <AppstoreOutlined />,
        label: t("sidebar.groups.monitoring"),
        roles: [Role.ADMIN, Role.TECHNICIAN, Role.SUPERVISOR],
        children: [
          {
            key: "system-performance",
            icon: <LineChartOutlined />,
            label: t("sidebar.system_performance"),
            roles: [Role.ADMIN, Role.TECHNICIAN, Role.SUPERVISOR],
          },
          {
            key: "security",
            icon: <SafetyOutlined />,
            label: t("sidebar.security"),
            roles: [Role.ADMIN, Role.TECHNICIAN, Role.SUPERVISOR],
          },
          {
            key: "error-logs",
            icon: <WarningOutlined />,
            label: t("sidebar.error_logs"),
            roles: [Role.ADMIN, Role.TECHNICIAN, Role.SUPERVISOR],
          },
        ],
      },
      {
        key: "reports-group",
        icon: <BarChartOutlined />,
        label: t("sidebar.groups.reports"),
        roles: [Role.ADMIN, Role.TECHNICIAN, Role.SUPERVISOR],
        children: [
          {
            key: "kpi",
            icon: <BarChartOutlined />,
            label: t("sidebar.kpi_management"),
            roles: [Role.ADMIN],
          },
          {
            key: "advanced-report",
            icon: <WarningOutlined />,
            label: t("sidebar.advanced_reports"),
            roles: [Role.ADMIN, Role.TECHNICIAN, Role.SUPERVISOR],
          },
        ],
      },
      {
        key: "system-group",
        icon: <SettingOutlined />,
        label: t("sidebar.groups.system"),
        roles: [Role.ADMIN],
        children: [
          {
            key: "employees",
            icon: <TeamOutlined />,
            label: t("sidebar.employee_management"),
            roles: [Role.ADMIN],
          },
          {
            key: "backup",
            icon: <DatabaseOutlined />,
            label: t("sidebar.backup_restore"),
            roles: [Role.ADMIN],
          },
        ],
      },
    ],
    [t]
  );

  const filteredMenu = useMemo(
    () => filterMenuItems(menuItems, user?.VaiTro),
    [menuItems, user]
  );

  const openKeys =
    manualOpenKeys ?? getParentKeys(filteredMenu, selectedKey) ?? [];

  const onOpenChange = (keys: string[]) => {
    const rootSubmenuKeys = filteredMenu.map((item) => item.key);
    const latestOpenKey = keys.find((key) => openKeys.indexOf(key) === -1);
    
    if (latestOpenKey && rootSubmenuKeys.includes(latestOpenKey)) {
      setManualOpenKeys([latestOpenKey]);
    } else {
      setManualOpenKeys(keys);
    }
  };

  const handleMenuClick = ({ key }: { key: string }) => {
    setManualOpenKeys(null);
    navigate(key === "dashboard" ? "/" : `/${key}`);
  };

  return (
    <Sider
      width={260}
      breakpoint="lg"
      collapsible
      collapsed={collapsed}
      onCollapse={setCollapsed}
      theme={dark ? "dark" : "light"}
      style={{
        position: "sticky",
        top: 0,
        height: "100vh",
        overflow: "auto",
      }}
    >
      <div
        style={{
          padding: collapsed ? "24px 0" : "24px 16px",
          textAlign: "center",
          whiteSpace: "nowrap",
          overflow: "hidden",
        }}
      >
        {collapsed ? (
          <Title
            level={4}
            style={{
              color: dark ? "#69b1ff" : "#1677ff",
              margin: 0,
            }}
          >
            NC
          </Title>
        ) : (
          <>
            <Title
              level={4}
              style={{
                color: dark ? "#69b1ff" : "#1677ff",
                marginBottom: 0,
              }}
            >
              NET-CORE
            </Title>
            <Text
              type="secondary"
              style={{
                fontSize: "0.8rem",
              }}
            >
              Quản lý mạng Viễn thông
            </Text>
          </>
        )}
      </div>

      <Menu
        mode="inline"
        selectedKeys={[selectedKey]}
        openKeys={openKeys}
        onOpenChange={onOpenChange}
        items={filteredMenu}
        onClick={handleMenuClick}
        style={{
          background: dark ? "#001529" : "#fff",
        }}
      />
    </Sider>
  );
}

