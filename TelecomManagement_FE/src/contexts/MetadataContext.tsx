import { useState, useEffect, useCallback, type ReactNode } from "react";
import { message } from "antd";
import { getDevices } from "../api/devicesApi";
import { getEmployees, type Employee } from "../api/employeesApi";
import { useAuth } from "../features/auth/useAuth";
import {
  MetadataContext,
  type SelectOption,
} from "./MetadataContextDefinition";

type Metadata = {
  deviceOptions: SelectOption[];
  employeeOptions: SelectOption[];
};

const loadMetadata = async (role: string | undefined): Promise<Metadata> => {
  const [devices, employees] = await Promise.all([
    getDevices(),
    role === "Admin" ? getEmployees() : Promise.resolve([] as Employee[]),
  ]);
  return {
    deviceOptions: devices.map(({ MaTB, TenTB }) => ({
      value: MaTB,
      label: TenTB,
    })),
    employeeOptions: employees.map(({ MaNV, HoTen }) => ({
      value: MaNV,
      label: HoTen,
    })),
  };
};

export const MetadataProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const { isAuthenticated, user } = useAuth();
  const role = user?.VaiTro;
  const [deviceOptions, setDeviceOptions] = useState<SelectOption[]>([]);
  const [employeeOptions, setEmployeeOptions] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshMetadata = useCallback(async () => {
    try {
      setLoading(true);
      const metadata = await loadMetadata(role);
      setDeviceOptions(metadata.deviceOptions);
      setEmployeeOptions(metadata.employeeOptions);
    } catch (error: unknown) {
      message.error(
        error instanceof Error
          ? error.message
          : "Không thể nạp danh sách thiết bị và nhân viên hệ thống.",
      );
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    void loadMetadata(role)
      .then((metadata) => {
        if (!active) return;
        setDeviceOptions(metadata.deviceOptions);
        setEmployeeOptions(metadata.employeeOptions);
      })
      .catch((error: unknown) => {
        if (active) {
          message.error(
            error instanceof Error
              ? error.message
              : "Không thể nạp danh sách thiết bị và nhân viên hệ thống.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [isAuthenticated, role]);

  return (
    <MetadataContext.Provider
      value={{ deviceOptions, employeeOptions, loading, refreshMetadata }}
    >
      {children}
    </MetadataContext.Provider>
  );
};
