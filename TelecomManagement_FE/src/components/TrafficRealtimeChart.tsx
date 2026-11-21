import { Card } from "antd";
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { useEffect, useMemo, useState } from "react";
import { Line } from "react-chartjs-2";
import { useTranslation } from "react-i18next";
import { getPerformance, type PerformanceRow } from "../api/performanceApi";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Legend,
  Tooltip,
  Title,
);

export default function TrafficRealtimeChart() {
  const { t } = useTranslation();
  const [chartState, setChartState] = useState({
    labels: [] as string[],
    latencySeries: [] as Array<number | null>,
    lossSeries: [] as Array<number | null>,
    latencyMax: 300,
  });

  useEffect(() => {
    let active = true;
    const refresh = () => {
      void getPerformance()
        .then((rows: PerformanceRow[]) => {
          if (!active) return;
          const snapshot = rows.slice(0, 20);
          const average = (values: Array<number | string | undefined>) => {
            const valid = values.map(Number).filter(Number.isFinite);
            return valid.length
              ? valid.reduce((sum, value) => sum + value, 0) / valid.length
              : null;
          };
          const latency = average(snapshot.map((row) => row.DoTre));
          const loss = average(snapshot.map((row) => row.MatGoi));
          const time = new Date().toLocaleTimeString("vi-VN", {
            hour12: false,
          });

          setChartState((previous) => {
            const latencySeries = [...previous.latencySeries.slice(-23), latency];
            const lossSeries = [...previous.lossSeries.slice(-23), loss];
            const peak = Math.max(
              0,
              ...latencySeries.filter(
                (value): value is number =>
                  value !== null && Number.isFinite(value),
              ),
            );
            return {
              labels: [...previous.labels.slice(-23), time],
              latencySeries,
              lossSeries,
              latencyMax: Math.max(300, Math.ceil(peak * 1.25)),
            };
          });
        })
        .catch((error: unknown) => console.error(error));
    };

    refresh();
    const interval = window.setInterval(refresh, 60_000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  const data = useMemo(
    () => ({
      labels: chartState.labels,
      datasets: [
        {
          label: t("traffic.yLatency"),
          data: chartState.latencySeries,
          borderColor: "#1677ff",
          backgroundColor: "rgba(22,119,255,.12)",
          tension: 0,
          spanGaps: true,
          yAxisID: "yLatency",
        },
        {
          label: t("traffic.yLoss"),
          data: chartState.lossSeries,
          borderColor: "#ff4d4f",
          backgroundColor: "rgba(255,77,79,.12)",
          tension: 0,
          spanGaps: true,
          yAxisID: "yLoss",
        },
      ],
    }),
    [chartState, t],
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
        yLatency: {
          type: "linear" as const,
          position: "left" as const,
          beginAtZero: true,
          min: 0,
          max: chartState.latencyMax,
          title: {
            display: true,
            text: t("traffic.yLatency"),
          },
        },
        yLoss: {
          type: "linear" as const,
          position: "right" as const,
          beginAtZero: true,
          min: 0,
          max: 100,
          grid: {
            drawOnChartArea: false,
          },
          title: {
            display: true,
            text: t("traffic.yLoss"),
          },
        },
      },
    }),
    [chartState.latencyMax, t],
  );

  return (
    <Card title={t("traffic.title")} className="mt-4">
      <div style={{ height: 280 }}>
        <Line data={data} options={options} />
      </div>
    </Card>
  );
}
