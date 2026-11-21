import {
  ArrowLeftOutlined,
  BugOutlined,
  ClockCircleOutlined,
  CloudServerOutlined,
  DashboardOutlined,
  InfoCircleOutlined,
  LinkOutlined,
  PoweroffOutlined,
  SafetyCertificateOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Descriptions,
  Flex,
  Layout,
  Row,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Timeline,
  Typography,
  message,
  theme,
} from "antd";
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { useCallback, useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth";
import {
  getDeviceDetail,
  toggleDevicePower,
  type DeviceDetail,
} from "../../api/devicesApi";


ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

const { Title: AntTitle, Text } = Typography;
const { Content } = Layout;

export const DeviceDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = theme.useToken();
  const { user } = useAuth();
  const isAdmin = user?.VaiTro === "Admin";
  // const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DeviceDetail | null>(null);

  const loadDetail = useCallback(async (deviceId: string) => {
    try {
      const res = await getDeviceDetail(deviceId);
      setData(res);
    } catch (error: unknown) {
      message.error(
        error instanceof Error
          ? error.message
          : "Không thể tải chi tiết thiết bị",
      );
      navigate("/devices");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (!id) return;
    let active = true;
    void getDeviceDetail(id)
      .then((result) => {
        if (active) setData(result);
      })
      .catch((error: unknown) => {
        if (!active) return;
        message.error(
          error instanceof Error
            ? error.message
            : "Không thể tải chi tiết thiết bị",
        );
        navigate("/devices");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, navigate]);

  const handlePowerToggle = async () => {
    if (!data?.device) return;
    try {
      const newStatus =
        data.device.TrangThai === "Hoạt động" ? "Dự phòng" : "Hoạt động";
      await toggleDevicePower(data.device.MaTB, { TrangThai: newStatus });
      message.success(`Đã chuyển sang ${newStatus}`);
      if (id) {
        setLoading(true);
        await loadDetail(id);
      }
    } catch (error: unknown) {
      message.error(
        error instanceof Error ? error.message : "Không thể bật/tắt nguồn",
      );
    }
  };

  if (loading || !data) {
    return (
      <Flex justify="center" align="center" style={{ minHeight: "60vh" }}>
        <Spin size="large" />
      </Flex>
    );
  }

  const { device, history, incidents, vulnerabilities, linksCount, timeline } =
    data;

  const isUp = device.TrangThai === "Hoạt động";

  // Chart Setup
  const chartData = {
    labels: history.map((h) =>
      new Date(h.ThoiGianGhiNhan).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    ),
    datasets: [
      {
        label: "Độ trễ (ms)",
        data: history.map((h) => h.DoTre || 0),
        borderColor: token.colorInfo,
        backgroundColor: token.colorInfoBg,
        tension: 0.3,
        pointRadius: 0,
        borderWidth: 2,
      },
      {
        label: "Mất gói (%)",
        data: history.map((h) => h.MatGoi || 0),
        borderColor: token.colorError,
        backgroundColor: token.colorErrorBg,
        tension: 0.3,
        pointRadius: 0,
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    scales: {
      x: {
        grid: {
          color: token.colorBorderSecondary,
        },
        ticks: {
          color: token.colorTextSecondary,
          maxTicksLimit: 12,
        },
      },
      y: {
        grid: {
          color: token.colorBorderSecondary,
        },
        ticks: {
          color: token.colorTextSecondary,
        },
      },
    },
    plugins: {
      legend: {
        labels: {
          color: token.colorText,
        },
      },
    },
  };

  // Table Columns
  const incidentCols = [
    {
      title: "Thời gian",
      dataIndex: "ThoiGianLoi",
      render: (v: string) => new Date(v).toLocaleString(),
    },
    { title: "Mô tả", dataIndex: "MoTaLoi" },
    {
      title: "Mức độ",
      dataIndex: "MucDoNghiemTrong",
      render: (v: string) => (
        <Tag color={v === "Cao" || v === "Nghiêm trọng" ? "error" : "warning"}>
          {v}
        </Tag>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "DaXuLy",
      render: (v: number) => (
        <Tag color={v ? "success" : "default"}>
          {v ? "Đã xử lý" : "Chưa xử lý"}
        </Tag>
      ),
    },
  ];

  const vulnCols = [
    { title: "Lỗ hổng", dataIndex: "TenLoHong" },
    {
      title: "Mức độ",
      dataIndex: "MucDo",
      render: (v: string) => (
        <Tag color={v === "Cao" || v === "Nghiêm trọng" ? "error" : "warning"}>
          {v}
        </Tag>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "TrangThaiKhacPhuc",
      render: (v: string) => (
        <Tag color={v === "Đã khắc phục" ? "success" : "default"}>{v}</Tag>
      ),
    },
    {
      title: "Phát hiện",
      dataIndex: "ThoiGianXayRaSuCo",
      render: (v: string) => new Date(v).toLocaleString(),
    },
  ];

  return (
    <Content style={{ padding: "0 24px" }}>
      {/* Back Button */}
      <Button
        type="link"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate("/devices")}
        style={{ paddingLeft: 0, marginBottom: 16 }}
      >
        Quay lại danh sách
      </Button>

      {/* Header */}
      <Card
        style={{ marginBottom: 16 }}
        styles={{
          body: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
          }
        }}
      >
        <Space size="large">
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              backgroundColor: token.colorFillTertiary,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontSize: 24,
              color: token.colorPrimary,
            }}
          >
            <CloudServerOutlined />
          </div>
          <div>
            <Space align="center">
              <AntTitle level={4} style={{ margin: 0 }}>
                {device.TenTB}
              </AntTitle>
              <Tag color={isUp ? "success" : "default"}>{device.TrangThai}</Tag>
            </Space>
            <Space
              size="middle"
              style={{ color: token.colorTextSecondary, marginTop: 4 }}
            >
              <Text type="secondary">
                <DashboardOutlined /> IP: <Text code>{device.DiaChiIP}</Text>
              </Text>
              <Text type="secondary">
                <InfoCircleOutlined /> Loại: {device.LoaiTB}
              </Text>
              <Text type="secondary">
                <InfoCircleOutlined /> Vị trí: {device.ViTri}
              </Text>
            </Space>
          </div>
        </Space>
        <Space>
          {isAdmin && <Button
            type={isUp ? "default" : "primary"}
            danger={isUp}
            icon={<PoweroffOutlined />}
            onClick={handlePowerToggle}
          >
            {isUp ? "Tắt nguồn" : "Bật nguồn"}
          </Button>}
          <Button
            type="primary"
            icon={<DashboardOutlined />}
            onClick={() => navigate("/")}
          >
            Xem trên Topology
          </Button>
        </Space>
      </Card>

      {/* KPI Grid */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={8} lg={4}>
          <Card size="small">
            <Statistic
              title="Uptime (24h)"
              value={device.UptimePercent ?? "--"}
              suffix="%"
              prefix={<ClockCircleOutlined style={{ color: token.colorInfo }} />}
              valueStyle={{ color: token.colorInfo }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card size="small">
            <Statistic
              title="Độ trễ"
              value={device.LatestLatency ?? "--"}
              suffix="ms"
              prefix={
                <DashboardOutlined style={{ color: token.colorPrimary }} />
              }
              valueStyle={{ color: token.colorPrimary }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card size="small">
            <Statistic
              title="Mất gói"
              value={device.LatestPacketLoss ?? "--"}
              suffix="%"
              prefix={<WarningOutlined style={{ color: token.colorError }} />}
              valueStyle={{ color: token.colorError }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card size="small">
            <Statistic
              title="Sự cố mở"
              value={incidents.filter((i) => i.DaXuLy === 0).length}
              prefix={<BugOutlined style={{ color: token.colorWarning }} />}
              valueStyle={{ color: token.colorWarning }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card size="small">
            <Statistic
              title="Lỗ hổng"
              value={
                vulnerabilities.filter((v) => v.TrangThaiKhacPhuc !== "Đã khắc phục")
                  .length
              }
              prefix={
                <SafetyCertificateOutlined style={{ color: token.colorSuccess }} />
              }
              valueStyle={{ color: token.colorSuccess }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card size="small">
            <Statistic
              title="Kết nối (Links)"
              value={linksCount}
              prefix={<LinkOutlined style={{ color: token.cyan }} />}
              valueStyle={{ color: token.cyan }}
            />
          </Card>
        </Col>
      </Row>

      {/* Info & Chart */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={10}>
          <Card
            title={
              <>
                <InfoCircleOutlined style={{ color: token.colorPrimary, marginRight: 8 }} />
                Thông tin Phần cứng
              </>
            }
            style={{ height: "100%" }}
          >
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="Loại thiết bị">
                {device.LoaiTB}
              </Descriptions.Item>
              <Descriptions.Item label="Địa chỉ MAC">
                <Text code>{device.DiaChiMAC || "--:--:--:--:--:--"}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Firmware">
                {device.Firmware || "--"}
              </Descriptions.Item>
              <Descriptions.Item label="Vị trí vật lý">
                {device.ViTri}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái nguồn">
                {device.TrangThai}
              </Descriptions.Item>
              <Descriptions.Item label="Lần cuối online">
                {device.LanCuoiOnline
                  ? new Date(device.LanCuoiOnline).toLocaleString()
                  : "--"}
              </Descriptions.Item>
            </Descriptions>
            <Text type="secondary" style={{ display: "block", marginTop: 16 }}>
              Nguồn hồ sơ: {device.MetadataSource || "--"}
            </Text>
          </Card>
        </Col>
        <Col xs={24} lg={14}>
          <Card
            title={
              <>
                <DashboardOutlined style={{ color: token.colorInfo, marginRight: 8 }} />
                Hiệu suất 24 giờ gần nhất
              </>
            }
            style={{ height: "100%" }}
          >
            <div style={{ height: 260 }}>
              <Line data={chartData} options={chartOptions} />
            </div>
          </Card>
        </Col>
      </Row>

      {/* Tables */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <>
                <WarningOutlined style={{ color: token.colorWarning, marginRight: 8 }} />
                Lịch sử Sự cố
              </>
            }
          >
            <Table
              dataSource={incidents}
              columns={incidentCols}
              rowKey="MaLoi"
              size="small"
              pagination={{ pageSize: 5 }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title={
              <>
                <BugOutlined style={{ color: token.colorError, marginRight: 8 }} />
                Lỗ hổng Bảo mật
              </>
            }
          >
            <Table
              dataSource={vulnerabilities}
              columns={vulnCols}
              rowKey="MaLH"
              size="small"
              pagination={{ pageSize: 5 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Timeline */}
      <Card
        title={
          <>
            <ClockCircleOutlined style={{ color: token.colorTextSecondary, marginRight: 8 }} />
            Nhật ký Thao tác
          </>
        }
      >
        <Timeline
          items={timeline.map((item) => ({
            color: item.status === "SUCCESS" ? "green" : "blue",
            children: (
              <>
                <Text strong>{item.action}</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Bởi {item.user} — {new Date(item.time).toLocaleString()}
                </Text>
              </>
            ),
          }))}
        />
      </Card>
    </Content>
  );
};
