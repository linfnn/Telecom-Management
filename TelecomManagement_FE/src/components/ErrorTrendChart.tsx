import { useEffect, useMemo, useState } from "react";
import { Card } from "antd";
import { Line } from "react-chartjs-2";
import { useTranslation } from "react-i18next";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Title,
} from "chart.js";
import { getErrorTrend, type ErrorTrendRow } from "../api/reportsApi";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Title,
);

const ERROR_TREND_FIXED_MAX = 100;

export default function ErrorTrendChart() {
  const { t } = useTranslation();
  const [dataSource, setDataSource] = useState<ErrorTrendRow[]>([]);
  const [lastUpdated, setLastUpdated] = useState("");

  useEffect(() => {
    let active = true;
    const refresh = () => {
      void getErrorTrend()
        .then((res) => {
          if (!active) return;
      const ordered = [...(Array.isArray(res) ? res : [])].sort(
        (a, b) => new Date(a.Ngay as string).getTime() - new Date(b.Ngay as string).getTime(),
      );
      setDataSource(ordered);
      setLastUpdated(
        new Date().toLocaleTimeString("vi-VN", {
          hour12: false,
        }),
      );
        })
        .catch((error: unknown) => console.error(error));
    };
    refresh();
    const timer = setInterval(refresh, 60_000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  const data = useMemo(
    () => ({
      labels: dataSource.map((x) =>
        new Date(x.Ngay as string).toLocaleDateString("vi-VN"),
      ),
      datasets: [
        {
          label: t("error_trends.total"),
          data: dataSource.map((x) => x.TongSoSuCo),
          borderColor: "#198754",
          backgroundColor: "rgba(25,135,84,.12)",
          tension: 0,
        },
        {
          label: t("error_trends.critical"),
          data: dataSource.map((x) => x.Critical),
          borderColor: "#741b1b",
          backgroundColor: "rgba(116,27,27,.12)",
          tension: 0,
        },
        {
          label: t("error_trends.high"),
          data: dataSource.map((x) => x.High),
          borderColor: "#dc3545",
          backgroundColor: "rgba(220,53,69,.12)",
          tension: 0,
        },
      ],
    }),
    [dataSource, t],
  );

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: false as const,
      plugins: {
        legend: {
          position: "top" as const,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          min: 0,
          max: ERROR_TREND_FIXED_MAX,
        },
      },
    }),
    [],
  );

  return (
    <Card title={t("error_trends.title")} extra={` ${t("error_trends.updated")}: ${lastUpdated}`}>
      <div style={{ height: 320 }}>
        <Line data={data} options={options} />
      </div>
    </Card>
  );
}
