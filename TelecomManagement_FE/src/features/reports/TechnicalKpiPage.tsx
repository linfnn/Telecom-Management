import { TrophyOutlined } from "@ant-design/icons";
import { Alert, Card, Col, List, Row, Space, Tag, theme, Typography } from "antd";
import { useEffect, useMemo, useState } from "react";
import { Bar } from "react-chartjs-2";
import { useTranslation } from "react-i18next";
import { useAuth } from "../auth";
import {
  getKpi,
  getKpiMonthlyRanking,
  type KpiRow,
} from "../../api/reportsApi";

// Đăng ký các thành phần bắt buộc của Chart.js cho biểu đồ cột
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";

const { Title } = Typography;

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
);

export const TechnicalKpiPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { token } = theme.useToken();
  const [chartRawData, setChartRawData] = useState<KpiRow[]>([]);
  const [rankingData, setRankingData] = useState<KpiRow[]>([]);
  const [chartTime, setChartTime] = useState<string>("--:--:--");
  const [rankingTime, setRankingTime] = useState<string>("--:--:--");
  const [chartError, setChartError] = useState<string | null>(null);
  const [rankingError, setRankingError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const isAdmin = user?.VaiTro === "Admin";

  useEffect(() => {
    if (user?.VaiTro !== "Admin") return;
    let active = true;
    const handleFailure = (error: unknown) => {
      if (!active) return;
      console.error(error);
      const detail = error instanceof Error ? error.message : undefined;
      setChartError(
        detail || t("technical_kpi.chart_error", "Không tải được biểu đồ KPI."),
      );
      setRankingError(
        detail || t("technical_kpi.ranking_error", "Không tải được xếp hạng KPI."),
      );
      setChartRawData([]);
      setRankingData([]);
      setLoading(false);
    };
    const handleSuccess = (rows: KpiRow[]) => {
      if (!active) return;
      if (!Array.isArray(rows)) {
        handleFailure(
          new Error(t("technical_kpi.invalid_data", "Dữ liệu KPI không hợp lệ.")),
        );
        return;
      }
      const updatedAt = new Date().toLocaleTimeString("vi-VN", {
        hour12: false,
      });
      setChartError(null);
      setRankingError(null);
      setChartRawData(rows);
      setRankingData(getKpiMonthlyRanking(rows));
      setChartTime(updatedAt);
      setRankingTime(updatedAt);
      setLoading(false);
    };
    void getKpi().then(handleSuccess).catch(handleFailure);
    const interval = window.setInterval(() => {
      void getKpi().then(handleSuccess).catch(handleFailure);
    }, 60_000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [user?.VaiTro, t]);

  // 4. Cấu hình dữ liệu hiển thị (Đã sửa map chuẩn thuộc tính JSON)
  const chartData = useMemo(() => {
    const labels = chartRawData.map((x) => String(x.HoTen || ""));
    // Sửa trường: SoSuCoDaXuLy và SoLoHongDaXuLy khớp với cấu trúc JSON của bạn
    const incidentData = chartRawData.map((x) => Number(x.SoSuCoDaXuLy || 0));
    const vulnData = chartRawData.map((x) => Number(x.SoLoHongDaXuLy || 0));

    return {
      labels,
      datasets: [
        {
          label: t('technical_kpi.incidents_handled', 'Sự cố đã xử lý'),
          data: incidentData,
          backgroundColor: token.colorPrimary,
          borderWidth: 1,
        },
        {
          label: t('technical_kpi.vulns_patched', 'Lỗ hổng đã vá'),
          data: vulnData,
          backgroundColor: token.colorSuccess,
          borderWidth: 1,
        },
      ],
    };
  }, [chartRawData, token, t]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" as const },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: t('technical_kpi.quantity', 'Số lượng (cases)') },
        ticks: { stepSize: 5 }, // Bước nhảy 5 đơn vị cho phù hợp với số lượng lớn (như 65, 95)
      },
      x: {
        title: { display: true, text: t('technical_kpi.technician', 'Nhân viên kỹ thuật') },
      },
    },
  };

  if (!isAdmin) {
    return (
      <div style={{ padding: 4 }}>
        <h3 style={{ fontWeight: "bold", marginBottom: 24 }}>
          {t('technical_kpi.title', 'Hiệu suất Đội ngũ Kỹ thuật')}
        </h3>
        <Alert
          message={t('technical_kpi.access_denied', 'Giới hạn quyền truy cập')}
          description={t('technical_kpi.access_desc', 'Chỉ tài khoản cấp quyền Quản trị viên (Admin) mới được phép theo dõi bảng xếp hạng KPI và biểu đồ năng suất làm việc của đội ngũ.')}
          type="warning"
          showIcon
        />
      </div>
    );
  }

  return (
    <div style={{ padding: "4px", overflowX: "hidden" }}>
      <Title level={3} style={{ fontWeight: "bold", marginBottom: 24 }}>
        {t('technical_kpi.title', 'Hiệu suất Đội ngũ Kỹ thuật')}
      </Title>

      <Row gutter={[24, 24]}>
        {/* CỘT TRÁI: BIỂU ĐỒ KPI */}
        <Col xs={24} lg={14}>
          <Card
            loading={loading && chartRawData.length === 0}
            title={
              <Row
                justify="space-between"
                align="middle"
                style={{ width: "100%" }}
              >
                <Col>{t('technical_kpi.chart_title', 'KPI xử lý (Sự cố + Lỗ hổng) / Nhân viên')}</Col>
                <Col>
                  <Space size={4}>
                    <Tag color="default">Polling 60s</Tag>
                    <small style={{ color: "#999", fontWeight: "normal" }}>
                      {t('technical_kpi.updated', 'Cập nhật')}: {chartTime}
                    </small>
                  </Space>
                </Col>
              </Row>
            }
          >
            {chartError && (
              <Alert
                message={chartError}
                type="error"
                showIcon
                style={{ marginBottom: 12 }}
              />
            )}
            <div style={{ height: 320, position: "relative" }}>
              {chartRawData.length > 0 ? (
                <Bar data={chartData} options={chartOptions} />
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    padding: "60px 0",
                    color: "#999",
                  }}
                >
                  {t('technical_kpi.no_data', 'Chưa ghi nhận dữ liệu hiệu suất')}
                </div>
              )}
            </div>
          </Card>
        </Col>

        {/* CỘT PHẢI: BẢNG XẾP HẠNG THÁNG */}
        <Col xs={24} lg={10}>
          <Card
            loading={loading && rankingData.length === 0}
            title={
              <Row
                justify="space-between"
                align="middle"
                style={{ width: "100%" }}
              >
                <Col>
                  <Space>
                    <TrophyOutlined style={{ color: token.colorWarning }} />
                    <span>Thứ hạng xử lý tổng hợp</span>
                  </Space>
                </Col>
                <Col>
                  <Space size={4}>
                    <Tag color="default">Polling 60s</Tag>
                    <small style={{ color: "#999", fontWeight: "normal" }}>
                      {t('technical_kpi.updated', 'Cập nhật')}: {rankingTime}
                    </small>
                  </Space>
                </Col>
              </Row>
            }
          >
            {rankingError ? (
              <Alert message={rankingError} type="error" showIcon />
            ) : (
              <List
                dataSource={rankingData}
                locale={{
                  emptyText: t('technical_kpi.empty_ranking', 'Chưa có xếp hạng tháng này (0 case đã xử lý).'),
                }}
                renderItem={(item) => (
                  <List.Item
                    extra={
                      <Tag color="success" style={{ borderRadius: 16 }}>
                        {Number(item.TongDaXuLy || 0)} công việc đã xử lý
                      </Tag>
                    }
                  >
                    <Space size={12}>
                      <Tag
                        color={
                          Number(item.ThuHang) === 1
                            ? "gold"
                            : Number(item.ThuHang) === 2
                              ? "blue"
                              : "default"
                        }
                        style={{ fontWeight: "bold" }}
                      >
                        #{Number(item.ThuHang || 0)}
                      </Tag>
                      <span
                        style={{
                          fontWeight:
                            Number(item.ThuHang) === 1 ? "bold" : "normal",
                        }}
                      >
                        {String(item.HoTen || "")}
                      </span>
                    </Space>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};
