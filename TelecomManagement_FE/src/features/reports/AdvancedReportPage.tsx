import { Card, Col, Row, Space, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { useEffect, useMemo, useRef, useState } from "react";
import { Chart } from "react-chartjs-2";
import { useTranslation } from "react-i18next";

// Đăng ký toàn bộ các thành phần lõi của Chart.js phục vụ báo cáo đa dạng (Line, Bar, Doughnut)
import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import {
  type CapacityRow,
  type ErrorSeverityRow,
  type ErrorTrendRow,
  type MonthlyIncidentRow,
  type StatusRow,
  type TopEmployeeRow,
  type UptimeRow,
  type VulnerabilityMapRow,
  type VulnerabilityStatusRow,
  getCapacityReport,
  getErrorSeverity,
  getErrorTrend,
  getMonthlyIncidentHistory,
  getStatusDistribution,
  getTopEmployees,
  getUptimeReport,
  getVulnerabilityMap,
  getVulnerabilityStatus,
} from "../../api/reportsApi";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  LineController,
  BarController,
  Tooltip,
  Legend,
);

const { Title } = Typography;

const ERROR_TREND_FIXED_MAX = 50; // Định mức trần hiển thị xu hướng lỗi (tùy chỉnh theo hệ thống)

type LoadResult<T> =
  | { data: T; error?: never }
  | { data: null; error: unknown };

const capture = async <T,>(request: Promise<T>): Promise<LoadResult<T>> => {
  try {
    return { data: await request };
  } catch (error: unknown) {
    return { data: null, error };
  }
};

export const AdvancedReportPage = () => {
  const { t } = useTranslation();
  // --- Hệ thống Refs quản lý Canvas để tránh hoàn toàn lỗi rò rỉ bộ nhớ / xung đột ID ---
  const repStatusChartRef = useRef<ChartJS>(null);
  const uptimeChartRef = useRef<ChartJS>(null);
  const errorSevChartRef = useRef<ChartJS>(null);
  const vulnStatusChartRef = useRef<ChartJS>(null);
  const errorTrendChartRef = useRef<ChartJS>(null);
  const vulnMapChartRef = useRef<ChartJS>(null);
  const monthlyIncidentChartRef = useRef<ChartJS>(null);

  // --- States lưu trữ dữ liệu nạp từ API ---
  const [statusDistribution, setStatusDistribution] = useState<StatusRow[]>([]);
  const [uptimeHistory, setUptimeHistory] = useState<{
    labels: string[];
    datasetMap: Record<string, Array<number | null>>;
  }>({ labels: [], datasetMap: {} });
  const [capacityData, setCapacityData] = useState<CapacityRow[]>([]);
  const [errorSevData, setErrorSevData] = useState<ErrorSeverityRow[]>([]);
  const [vulnStatusData, setVulnStatusData] = useState<VulnerabilityStatusRow[]>([]);
  const [topEmployees, setTopEmployees] = useState<TopEmployeeRow[]>([]);
  const [errorTrend, setErrorTrend] = useState<ErrorTrendRow[]>([]);
  const [vulnMapData, setVulnMapData] = useState<VulnerabilityMapRow[]>([]);
  const [monthlyIncident, setMonthlyIncident] = useState<MonthlyIncidentRow[]>([]);

  // Timestamps cập nhật realtime
  const [uptimeTime, setUptimeTime] = useState<string>("--:--:--");
  const [trendTime, setTrendTime] = useState<string>("--:--:--");

  const updateUptimeState = (res: UptimeRow[]) => {
    const labelTime = dayjs().format("HH:mm:ss");

    setUptimeHistory((prev) => {
      const nextLabels = [...prev.labels, labelTime].slice(-20); // Giữ tối đa 20 mốc gần nhất
      const updatedMap = { ...prev.datasetMap };

      res.forEach((x) => {
        if (!updatedMap[x.TenTB]) {
          updatedMap[x.TenTB] = Array(prev.labels.length).fill(null);
        }
      });

      Object.keys(updatedMap).forEach((deviceName) => {
        const hit = res.find((x) => x.TenTB === deviceName);
        const latency = Number(hit?.DoTre);
        const value = hit && Number.isFinite(latency) ? latency : null;
        updatedMap[deviceName] = [
          ...updatedMap[deviceName],
          value,
        ].slice(-20);
      });

      return { labels: nextLabels, datasetMap: updatedMap };
    });
    setUptimeTime(labelTime);
  };

  // Điều phối kích hoạt nạp dữ liệu định kì (Realtime)
  useEffect(() => {
    let active = true;
    const fetchReports = () =>
      Promise.all([
        capture(getStatusDistribution()),
        capture(getUptimeReport()),
        capture(getCapacityReport()),
        capture(getErrorSeverity()),
        capture(getVulnerabilityStatus()),
        capture(getTopEmployees()),
        capture(getErrorTrend()),
        capture(getVulnerabilityMap()),
        capture(getMonthlyIncidentHistory()),
      ]);
    const applyReports = (
      results: Awaited<ReturnType<typeof fetchReports>>,
    ) => {
      if (!active) return;
      const [
        status,
        uptime,
        capacity,
        severity,
        vulnerabilityStatus,
        employees,
        trend,
        vulnerabilityMap,
        monthly,
      ] = results;
      const reportErrors = results.flatMap((result) =>
        result.error === undefined ? [] : [result.error],
      );
      reportErrors.forEach((error) => console.error("Report refresh failed:", error));

      if (status.data) setStatusDistribution(status.data);
      else setStatusDistribution([]);
      if (uptime.data) updateUptimeState(uptime.data);
      if (capacity.data) setCapacityData(capacity.data);
      if (severity.data) setErrorSevData(severity.data);
      if (vulnerabilityStatus.data) setVulnStatusData(vulnerabilityStatus.data);
      if (employees.data) setTopEmployees(employees.data);
      if (trend.data) {
        setErrorTrend(
          [...trend.data].sort(
            (a, b) => new Date(a.Ngay).getTime() - new Date(b.Ngay).getTime(),
          ),
        );
        setTrendTime(dayjs().format("HH:mm:ss"));
      }
      if (vulnerabilityMap.data) setVulnMapData(vulnerabilityMap.data);
      if (monthly.data) setMonthlyIncident(monthly.data);
    };

    void fetchReports().then(applyReports);
    const interval = setInterval(() => {
      void fetchReports().then(applyReports);
    }, 60_000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  // --- XỬ LÝ ĐỔ DỮ LIỆU SANG CẤU HÌNH CHART.JS ---

  // Biểu đồ Phân bổ trạng thái (Pie Chart)
  const statusChartData = useMemo(() => {
    const labels = statusDistribution.map((x) => x.TrangThai);
    const values = statusDistribution.map((x) => Number(x.SoLuong) || 0);
    const colors = [
      "#2ecc71",
      "#e74c3c",
      "#f1c40f",
      "#0dcaf0",
      "#6f42c1",
      "#fd7e14",
    ];

    return {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: colors.slice(0, Math.max(labels.length, 1)),
        },
      ],
    };
  }, [statusDistribution]);

  // Biểu đồ Uptime %
  const uptimeChartData = useMemo(() => {
    const colorPalette = [
      "#0d6efd",
      "#198754",
      "#dc3545",
      "#ffc107",
      "#6f42c1",
    ];
    const datasets = Object.keys(uptimeHistory.datasetMap).map(
      (deviceName, idx) => ({
        label: deviceName,
        data: uptimeHistory.datasetMap[deviceName],
        borderColor: colorPalette[idx % colorPalette.length],
        backgroundColor: "transparent",
        tension: 0.3,
        spanGaps: true,
      }),
    );
    return { labels: uptimeHistory.labels, datasets };
  }, [uptimeHistory]);

  // Biểu đồ Doughnut Mức độ nghiêm trọng
  const errorSevChartData = useMemo(
    () => ({
      labels: errorSevData.map((x) => x.MucDo),
      datasets: [
        {
          data: errorSevData.map((x) => x.SoLuongSuCo),
          backgroundColor: ["#741b1b", "#dc3545", "#ffc107", "#198754"],
        },
      ],
    }),
    [errorSevData],
  );

  // Biểu đồ Trạng thái lỗ hổng
  const vulnStatusChartData = useMemo(
    () => ({
      labels: vulnStatusData.map((x) => x.TrangThai),
      datasets: [
        {
          label: t('advanced_report.vuln_status_count', 'Số Lỗ Hổng'),
          data: vulnStatusData.map((x) => x.SoLuong),
          backgroundColor: ["#198754", "#ffc107", "#dc3545"],
        },
      ],
    }),
    [vulnStatusData, t],
  );

  // Biểu đồ Xu hướng sự cố theo ngày (Line Area)
  const errorTrendChartData = useMemo(
    () => ({
      labels: errorTrend.map((x) => dayjs(x.Ngay).format("DD/MM")),
      datasets: [
        {
          label: t('advanced_report.trend_total', 'Tổng Sự Cố'),
          data: errorTrend.map((x) => x.TongSoSuCo),
          borderColor: "#198754",
          backgroundColor: "rgba(25, 135, 84, 0.08)",
          tension: 0,
          fill: true,
        },
        {
          label: t('advanced_report.trend_critical', 'Critical'),
          data: errorTrend.map((x) => x.Critical),
          borderColor: "#741b1b",
          backgroundColor: "rgba(116, 27, 27, 0.08)",
          tension: 0,
          fill: true,
        },
        {
          label: t('advanced_report.trend_high', 'High'),
          data: errorTrend.map((x) => x.High),
          borderColor: "#dc3545",
          backgroundColor: "rgba(220, 53, 69, 0.08)",
          tension: 0,
          fill: true,
        },
      ],
    }),
    [errorTrend, t],
  );

  // Biến đổi dữ liệu thô sang cấu trúc Object của Chart.js Cột Ngang Chồng
  const vulnMapChartData = useMemo(() => {
    const labels = vulnMapData.map((item) => item.TenTB);
    const criticalCounts = vulnMapData.map(
      (item) => Number(item.CriticalCount) || 0,
    );
    const highCounts = vulnMapData.map((item) => Number(item.HighCount) || 0);
    const mediumCounts = vulnMapData.map(
      (item) => Number(item.MediumCount) || 0,
    );

    return {
      labels,
      datasets: [
        {
          label: t('advanced_report.critical', 'Critical (Nguy cấp)'),
          data: criticalCounts,
          backgroundColor: "#741b1b", // Đỏ đậm
        },
        {
          label: t('advanced_report.high', 'High (Cao)'),
          data: highCounts,
          backgroundColor: "#dc3545", // Đỏ tươi
        },
        {
          label: t('advanced_report.medium', 'Medium (Trung bình)'),
          data: mediumCounts,
          backgroundColor: "#ffc107", // Vàng
        },
      ],
    };
  }, [vulnMapData, t]);

  // Cấu hình quay ngang biểu đồ và tính năng chồng cột
  const vulnMapChartOptions = {
    indexAxis: "y" as const, // <-- Chìa khóa để quay ngang biểu đồ (Bar thành Horizontal Bar)
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom" as const },
    },
    scales: {
      x: {
        stacked: true, // Kích hoạt xếp chồng trục X
        title: { display: true, text: t('advanced_report.vuln_count', 'Số lượng lỗ hổng') },
        ticks: { stepSize: 1 },
      },
      y: {
        stacked: true, // Kích hoạt xếp chồng trục Y
      },
    },
  };

  // Biểu đồ Lịch sử sự cố thiết bị theo tháng (Stacked Bar)
  const monthlyIncidentChartData = useMemo(() => {
    const months = [...new Set(monthlyIncident.map((x) => x.Thang))];
    const uniqueDevices = [...new Set(monthlyIncident.map((x) => x.TenTB))];
    const colorPalette = [
      "#0d6efd",
      "#198754",
      "#dc3545",
      "#ffc107",
      "#6f42c1",
      "#fd7e14",
    ];

    const datasets = uniqueDevices.map((device, idx) => ({
      label: device,
      data: months.map((month) => {
        const hit = monthlyIncident.find(
          (r) => r.Thang === month && r.TenTB === device,
        );
        return hit ? Number(hit.SoSuCo) : 0;
      }),
      backgroundColor: colorPalette[idx % colorPalette.length],
      borderWidth: 0,
    }));

    return { labels: months, datasets };
  }, [monthlyIncident]);

  // --- CẤU HÌNH CỘT CHO CÁC BẢNG (ANTD TABLES) ---
  const capacityColumns: ColumnsType<CapacityRow> = [
    { title: "Loại thiết bị", dataIndex: "LoaiTB", key: "LoaiTB" },
    { title: "Số lượng", dataIndex: "SoLuong", key: "SoLuong" },
  ];

  const topEmployeesColumns: ColumnsType<TopEmployeeRow> = [
    {
      title: t('advanced_report.table_name', 'Họ Tên'),
      key: "HoTen",
      render: (_, x, idx) => (
        <span>
          <Tag color="blue">#{idx + 1}</Tag> {x.HoTen}
        </span>
      ),
    },
    {
      title: t('advanced_report.table_total_incidents', 'Tổng Sự Cố'),
      dataIndex: "TongSoSuCo",
      key: "TongSoSuCo",
      align: "center",
      render: (v) => <strong>{v}</strong>,
    },
    { title: "Đã xử lý", dataIndex: "DaXuLy", key: "DaXuLy", align: "center" },
    { title: "Đang xử lý", dataIndex: "DangXuLy", key: "DangXuLy", align: "center" },
  ];

  return (
    <div style={{ padding: "4px", overflowX: "hidden" }}>
      <Title level={3} style={{ fontWeight: "bold", marginBottom: 24 }}>
        {t('advanced_report.title', 'Phân tích Báo cáo Chuyên sâu')}
      </Title>

      <Row gutter={[16, 16]}>
        {/* ROW 1: Trạng thái sự cố & độ trễ */}
        <Col xs={24} lg={12}>
          <Card
            title={<span style={{ color: "#1890ff" }}>{t('advanced_report.status_dist', 'Phân bổ Trạng thái')}</span>}
            bordered={false}
          >
            <div style={{ height: 280 }}>
              {statusDistribution.length > 0 ? (
                <Chart
                  ref={repStatusChartRef}
                  type="pie" // <-- Định dạng đồ thị tròn
                  data={statusChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: "bottom" as const },
                    },
                  }}
                />
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    paddingTop: 100,
                    color: "#999",
                  }}
                >
                  {t('advanced_report.no_status_data', 'Chưa thu thập được dữ liệu trạng thái')}
                </div>
              )}
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={
              <Row
                justify="space-between"
                align="middle"
                style={{ width: "100%" }}
              >
                <Col style={{ color: "#096dd9" }}>
                  Độ trễ theo thiết bị (ms)
                </Col>
                <Col>
                  <Space>
                    <Tag>Định kỳ</Tag>
                    <small style={{ color: "#999" }}>
                      {t('advanced_report.updated', 'Cập nhật')}: {uptimeTime}
                    </small>
                  </Space>
                </Col>
              </Row>
            }
            bordered={false}
          >
            <div style={{ height: 280 }}>
              {uptimeHistory.labels.length > 0 ? (
                <Chart
                  ref={uptimeChartRef}
                  type="line"
                  data={uptimeChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        min: 0,
                        title: { display: true, text: "Độ trễ (ms)" },
                      },
                    },
                  }}
                />
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    paddingTop: 100,
                    color: "#999",
                  }}
                >
                  {t('advanced_report.connecting', 'Đang kết nối tín hiệu...')}
                </div>
              )}
            </div>
          </Card>
        </Col>

        {/* ROW 2: Device counts by type */}
        <Col span={24}>
          <Card
            title={
              <span style={{ color: "#389e0d" }}>
                Số lượng thiết bị theo loại
              </span>
            }
            bordered={false}
          >
            <Table
              rowKey="LoaiTB"
              size="small"
              columns={capacityColumns}
              dataSource={capacityData}
              pagination={false}
              scroll={{ y: 250 }}
            />
          </Card>
        </Col>

        {/* ROW 3: Severity & Status Charts */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <span style={{ color: "#cf1322" }}>
                {t('advanced_report.severity', 'Sự Cố theo Mức Độ Nghiêm Trọng')}
              </span>
            }
            bordered={false}
          >
            <div style={{ height: 280 }}>
              <Chart
                ref={errorSevChartRef}
                type="doughnut"
                data={errorSevChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: "bottom" } },
                }}
              />
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={
              <span style={{ color: "#d4b106" }}>{t('advanced_report.vuln_status', 'Trạng Thái Sửa Lỗ Hổng')}</span>
            }
            bordered={false}
          >
            <div style={{ height: 280 }}>
              <Chart
                ref={vulnStatusChartRef}
                type="bar"
                data={vulnStatusChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: "top" } },
                }}
              />
            </div>
          </Card>
        </Col>

        {/* ROW 4: Top 5 Employees */}
        <Col span={24}>
          <Card
            title={
              <span style={{ color: "#096dd9" }}>
                Nhân viên và số sự cố được phân công
              </span>
            }
            bordered={false}
          >
            <Table
              rowKey="Email"
              size="small"
              columns={topEmployeesColumns}
              dataSource={topEmployees}
              pagination={false}
              scroll={{ y: 250 }}
            />
          </Card>
        </Col>

        {/* ROW 5: Xu hướng sự cố theo ngày */}
        <Col span={24}>
          <Card
            title={
              <Row
                justify="space-between"
                align="middle"
                style={{ width: "100%" }}
              >
                <Col style={{ color: "#535353" }}>{t('advanced_report.trend', 'Xu Hướng Sự Cố theo Ngày')}</Col>
                <Col>
                  <Space>
                    <Tag>{t('advanced_report.realtime', 'Realtime')}</Tag>
                    <small style={{ color: "#999" }}>
                      {t('advanced_report.updated', 'Cập nhật')}: {trendTime}
                    </small>
                  </Space>
                </Col>
              </Row>
            }
            bordered={false}
          >
            <div style={{ height: 300 }}>
              <Chart
                ref={errorTrendChartRef}
                type="line"
                data={errorTrendChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: "top" } },
                  scales: {
                    y: {
                      beginAtZero: true,
                      min: 0,
                      max: ERROR_TREND_FIXED_MAX,
                    },
                  },
                }}
              />
            </div>
          </Card>
        </Col>

        {/* ROW 6: Risk Map Placeholder (Thường là bản đồ nhiệt bong bóng hoặc ma trận trong SQL) */}
        {/* ROW 6: Vulnerability Risk Map */}
        <Col span={24}>
          <Card
            title={
              <Space style={{ color: "#cf1322" }}>
                <i className="fas fa-shield-virus"></i>
                <span>{t('advanced_report.risk_map', 'Bản đồ Lỗ hổng Bảo mật theo Thiết bị (Risk Map)')}</span>
              </Space>
            }
            bordered={false}
          >
            <div style={{ height: 320 }}>
              {vulnMapData.length > 0 ? (
                <Chart
                  ref={vulnMapChartRef}
                  type="bar" // Gốc vẫn dùng 'bar' của Chart.js, options xoay ngang sẽ lo phần còn lại
                  data={vulnMapChartData}
                  options={vulnMapChartOptions}
                />
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    paddingTop: 130,
                    color: "#999",
                  }}
                >
                  {t('advanced_report.no_vuln_data', 'Chưa ghi nhận dữ liệu lỗ hổng thiết bị')}
                </div>
              )}
            </div>
          </Card>
        </Col>

        {/* ROW 7: Monthly Device Incident History */}
        <Col span={24}>
          <Card
            title={t('advanced_report.monthly_incident', 'Báo cáo Lịch sử Sự cố Thiết bị theo Tháng')}
            bordered={false}
          >
            <div style={{ height: 320 }}>
              <Chart
                ref={monthlyIncidentChartRef}
                type="bar"
                data={monthlyIncidentChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: "bottom" } },
                  scales: {
                    x: { stacked: true },
                    y: { stacked: true, beginAtZero: true },
                  },
                }}
              />
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};
