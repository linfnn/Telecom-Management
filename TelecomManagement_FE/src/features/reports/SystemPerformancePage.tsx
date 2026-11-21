import { SearchOutlined } from "@ant-design/icons";
import { Card, Col, Input, Row, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState, useRef } from "react";
import { Chart } from "react-chartjs-2";
import { getPerformance, type PerformanceRow } from "../../api/performanceApi";
import { useTranslation } from "react-i18next";

const { Title } = Typography;

// Đăng ký toàn bộ các thành phần cấu tạo nên biểu đồ hỗn hợp
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  LineController,
  BarController,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  LineController,
  BarController,
  Tooltip,
  Legend,
);

interface NormalizedPerfData extends PerformanceRow {
  DoTreNum: number | null;
  MatGoiNum: number | null;
}

export const SystemPerformancePage = () => {
  const { t } = useTranslation();
  const [perfData, setPerfData] = useState<NormalizedPerfData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");

  // Dùng ref để kiểm soát vòng đời Canvas của ChartJS, tránh lỗi "Canvas is already in use"
  const chartRef = useRef<ChartJS>(null);

  // 1. Hàm chuẩn hóa tiếng Việt để tìm kiếm không dấu
  const normalize = (s: unknown): string => {
    if (s === null || s === undefined) return "";
    return String(s)
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "");
  };

  // 2. Gọi API lấy dữ liệu hiệu suất
  useEffect(() => {
    let active = true;
    const handleData = (data: PerformanceRow[]) => {
      if (!active) return;
      if (!data || data.length === 0) {
        setPerfData([]);
        setLoading(false);
        return;
      }

      const normalized = data.map((x) => {
        const parsedLatency = Number(x.DoTre);
        const parsedLoss = Number(x.MatGoi);
        return {
          ...x,
          DoTreNum: Number.isFinite(parsedLatency) ? parsedLatency : null,
          MatGoiNum: Number.isFinite(parsedLoss) ? parsedLoss : null,
        };
      });

      setPerfData(normalized);
      setLoading(false);
    };
    const handleError = (error: unknown) => {
      if (!active) return;
      console.error("Load Performance Error:", error);
      setPerfData([]);
      setLoading(false);
    };
    void getPerformance().then(handleData).catch(handleError);
    const interval = window.setInterval(() => {
      void getPerformance().then(handleData).catch(handleError);
    }, 60_000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  // 3. Logic lọc tìm kiếm bằng useMemo
  const filteredData = useMemo(() => {
    const q = normalize(search);
    if (!q) return perfData;

    return perfData.filter((x) =>
      [x.TenTB, x.DoTre, x.MatGoi].some((field) =>
        normalize(field).includes(q),
      ),
    );
  }, [perfData, search]);

  // 4. Cấu hình Cột Bảng Độ Trễ
  const latencyColumns: ColumnsType<NormalizedPerfData> = [
    { title: t('system_performance.device_col', 'Thiết Bị'), dataIndex: "TenTB", key: "TenTB" },
    {
      title: t('system_performance.latency_col', 'Độ Trễ'),
      dataIndex: "DoTreNum",
      key: "DoTreNum",
      align: "right",
      render: (v: number | null) =>
        v !== null ? (
          <Tag color={v > 50 ? "warning" : "success"}>{v} ms</Tag>
        ) : (
          "--"
        ),
    },
  ];

  // 5. Cấu hình Cột Bảng Mất Gói
  const packetLossColumns: ColumnsType<NormalizedPerfData> = [
    { title: t('system_performance.device_col', 'Thiết Bị'), dataIndex: "TenTB", key: "TenTB" },
    {
      title: t('system_performance.loss_col', 'Mất Gói'),
      dataIndex: "MatGoiNum",
      key: "MatGoiNum",
      align: "right",
      render: (v: number | null) =>
        v !== null ? (
          <Tag color={v > 2 ? "error" : "success"}>{v} %</Tag>
        ) : (
          "0%"
        ),
    },
  ];

  // 6. Cấu hình dữ liệu cho Chart.js hiển thị THEO THIẾT BỊ
  const chartData = useMemo(() => {
    const labels = filteredData.map((x) => x.TenTB);
    const latencyData = filteredData.map((x) => x.DoTreNum);
    const packetLossData = filteredData.map((x) => x.MatGoiNum);

    return {
      labels,
      datasets: [
        {
          label: t('system_performance.latency_ms', 'Độ trễ (ms)'),
          data: latencyData,
          borderColor: "#1677ff",
          backgroundColor: "#1677ff",
          yAxisID: "y-latency",
          type: "line" as const,
          borderWidth: 2,
          pointRadius: 4,
          tension: 0.2,
        },
        {
          label: t('system_performance.loss_pct', 'Mất gói (%)'),
          data: packetLossData,
          borderColor: "#ff4d4f",
          backgroundColor: "#ff4d4f",
          yAxisID: "y-loss",
          type: "line" as const,
          borderWidth: 2,
          pointRadius: 4,
          tension: 0.2,
        },
      ],
    };
  }, [filteredData, t]);

  // Cấu hình hiển thị (Options) cho biểu đồ trục Y kép
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" as const },
      tooltip: {
        mode: "index" as const,
        intersect: false,
      },
    },
    scales: {
      x: {
        title: { display: true, text: t('system_performance.device_list', 'Danh sách thiết bị mạng') },
      },
      "y-latency": {
        type: "linear" as const,
        position: "left" as const,
        title: { display: true, text: t('system_performance.latency_ms', 'Độ trễ (ms)') },
        min: 0,
      },
      "y-loss": {
        type: "linear" as const,
        position: "right" as const,
        title: { display: true, text: t('system_performance.loss_pct', 'Mất gói (%)') },
        min: 0,
        grid: { drawOnChartArea: false },
      },
    },
  };

  return (
    <div style={{ overflowX: "hidden" }}>
      <Title level={3} style={{ fontWeight: "bold", marginBottom: 24 }}>
        {t('system_performance.title', 'Chỉ Số Hiệu Suất Hệ Thống')}
      </Title>

      {/* Thanh Tìm Kiếm */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8}>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder={t('system_performance.search_placeholder', 'Tìm theo tên thiết bị, độ trễ, mất gói…')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Col>
        <Col>
          <Tag color="blue">
            {t('system_performance.results', 'Kết quả')}: {filteredData.length}/{perfData.length} {t('system_performance.devices', 'thiết bị')}
          </Tag>
        </Col>
      </Row>

      {/* Khu vực Bảng Số Liệu */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={12}>
          <Card title={t('system_performance.avg_latency', 'Độ Trễ Trung Bình (ms)')} bordered={false}>
            <Table
              rowKey="TenTB"
              size="small"
              loading={loading}
              columns={latencyColumns}
              dataSource={filteredData}
              pagination={{ pageSize: 5 }}
            />
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title={t('system_performance.avg_loss', 'Mất Gói Trung Bình (%)')} bordered={false}>
            <Table
              rowKey="TenTB"
              size="small"
              loading={loading}
              columns={packetLossColumns}
              dataSource={filteredData}
              pagination={{ pageSize: 5 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Khu vực Biểu Đồ Thực Tế Theo Thiết Bị */}
      <Row style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card
            title={t('system_performance.compare_chart', 'Biểu Đồ So Sánh Hiệu Suất Giữa Các Thiết Bị')}
            bordered={false}
          >
            <div style={{ height: 350 }}>
              {filteredData.length > 0 ? (
                <Chart
                  ref={chartRef}
                  type="line"
                  data={chartData}
                  options={chartOptions}
                />
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px 0",
                    color: "#999",
                  }}
                >
                  {t('system_performance.no_data', 'Không có dữ liệu thiết bị để hiển thị biểu đồ')}
                </div>
              )}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};;
