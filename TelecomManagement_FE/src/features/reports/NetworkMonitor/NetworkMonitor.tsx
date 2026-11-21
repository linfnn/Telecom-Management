import { Alert, Card, Col, Row, Space, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import {
  type MonitorDevice,
  type MonitorLink,
} from "../../../api/networkMonitorApi";
import {
  connectNetworkMonitorSocket,
  type NetworkMonitorConnectionState,
} from "../../../api/networkMonitorSocket";

export const NetworkMonitor = () => {
  const [devices, setDevices] = useState<MonitorDevice[]>([]);
  const [links, setLinks] = useState<MonitorLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [connectionState, setConnectionState] =
    useState<NetworkMonitorConnectionState>("connecting");
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const disconnect = connectNetworkMonitorSocket({
      onSnapshot: (snapshot) => {
        if (!active) return;
        setDevices(snapshot.devices);
        setLinks(snapshot.links);
        setLastUpdated(new Date(snapshot.serverTime).toLocaleTimeString());
        setConnectionError(null);
        setLoading(false);
      },
      onStatus: (status) => {
        if (!active) return;
        setConnectionState(status);
        if (status !== "connecting" && status !== "connected") {
          setLoading(false);
        }
      },
      onError: (error) => {
        if (active) setConnectionError(error);
      },
    });

    return () => {
      active = false;
      disconnect();
    };
  }, []);

  const deviceColumns: ColumnsType<MonitorDevice> = [
    { title: "Thiết bị", dataIndex: "TenTB", key: "TenTB" },
    { title: "Loại", dataIndex: "LoaiTB", key: "LoaiTB" },
    { title: "Địa chỉ IP", dataIndex: "DiaChiIP", key: "DiaChiIP" },
    { title: "Vị trí", dataIndex: "ViTri", key: "ViTri" },
    {
      title: "Ping",
      dataIndex: "MonitorState",
      key: "MonitorState",
      render: (status: string) => {
        const color =
          status === "RESPONSIVE"
            ? "green"
            : status === "NO_RESPONSE"
              ? "orange"
              : "default";
        const label =
          status === "RESPONSIVE"
            ? "Có phản hồi"
            : status === "NO_RESPONSE"
              ? "Không phản hồi"
              : "Chưa xác định";
        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: "Độ trễ ping",
      dataIndex: "PingLatencyMs",
      key: "PingLatencyMs",
      render: (value: number | null) => (value == null ? "—" : `${value} ms`),
    },
    {
      title: "Hiệu suất ghi nhận gần nhất",
      key: "latestMetrics",
      render: (_value: unknown, device: MonitorDevice) => (
        <Space direction="vertical" size={0}>
          <Typography.Text>
            Độ trễ:{" "}
            {device.LatestLatencyMs === null
              ? "—"
              : `${device.LatestLatencyMs} ms`}
            ; mất gói:{" "}
            {device.LatestPacketLossPercent === null
              ? "—"
              : `${device.LatestPacketLossPercent}%`}
          </Typography.Text>
          <Typography.Text type="secondary">
            {device.LatestMetricTime
              ? new Date(device.LatestMetricTime).toLocaleString()
              : "Chưa có thời điểm ghi nhận"}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "TrangThai",
      key: "TrangThai",
      render: (status: string) => (
        <Tag color={status === "Hoạt động" ? "green" : "default"}>
          {status || "Chưa khai báo"}
        </Tag>
      ),
    },
  ];

  const linkColumns: ColumnsType<MonitorLink> = [
    { title: "Thiết bị nguồn", dataIndex: "TenTB_Goc", key: "TenTB_Goc" },
    { title: "Thiết bị đích", dataIndex: "TenTB_Dich", key: "TenTB_Dich" },
    {
      title: "Băng thông tối đa",
      dataIndex: "BangThongToiDa",
      key: "BangThongToiDa",
      render: (value: number | null) => (value == null ? "—" : `${value} Mbps`),
    },
    {
      title: "Trạng thái liên kết",
      dataIndex: "MonitorState",
      key: "MonitorState",
      render: (_value: unknown, link: MonitorLink) => (
        <Tag color="default">{link.TrangThai}</Tag>
      ),
    },
  ];

  const connectionMessage =
    connectionState === "connected"
      ? "Đang nhận cập nhật realtime qua WebSocket."
      : connectionState === "unauthorized"
        ? "Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại."
        : connectionState === "disconnected"
          ? "Mất kết nối WebSocket; hệ thống đang tự kết nối lại."
          : "Đang kết nối WebSocket giám sát mạng.";

  return (
    <Card
      title="Tổng quan hạ tầng mạng"
      extra={
        <Typography.Text type="secondary">
          Cập nhật: {lastUpdated || "—"}
        </Typography.Text>
      }
    >
      <Alert
        type={connectionError || connectionState === "unauthorized" ? "error" : "info"}
        showIcon
        message={connectionError ?? connectionMessage}
        description="Ping là một mẫu ICMP định kỳ; CPU/RAM/nhiệt độ cần agent hoặc SNMP. Trạng thái liên kết vật lý chưa có nguồn dữ liệu điều khiển."
        style={{ marginBottom: 16 }}
      />
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Space direction="vertical" style={{ width: "100%" }}>
            <Typography.Title level={5}>Thiết bị</Typography.Title>
            <Table
              rowKey="MaTB"
              size="small"
              loading={loading}
              columns={deviceColumns}
              dataSource={devices}
              pagination={{ pageSize: 5 }}
            />
          </Space>
        </Col>
        <Col span={24}>
          <Space direction="vertical" style={{ width: "100%" }}>
            <Typography.Title level={5}>Liên kết</Typography.Title>
            <Table
              rowKey="MaLK"
              size="small"
              loading={loading}
              columns={linkColumns}
              dataSource={links}
              pagination={{ pageSize: 5 }}
            />
          </Space>
        </Col>
      </Row>
    </Card>
  );
};
