import { useEffect, useMemo, useState } from "react";
import { Card } from "antd";
import { Line } from "react-chartjs-2";
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
import { getPerformance, type PerformanceRow } from "../api/performanceApi";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Title,
);

export default function UptimeRealtimeChart() {
  const [rows, setRows] = useState<PerformanceRow[]>([]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const result = await getPerformance();
        if (active) {
          setRows(
            [...result]
              .sort((a, b) =>
                String(a.ThoiGianGhiNhan ?? "").localeCompare(
                  String(b.ThoiGianGhiNhan ?? ""),
                ),
              )
              .slice(-20),
          );
        }
      } catch (error) {
        console.error("Could not load performance records", error);
      }
    };

    void load();
    const interval = window.setInterval(load, 60_000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  const data = useMemo(
    () => ({
      labels: rows.map((row) => {
        const time =
          typeof row.ThoiGianGhiNhan === "string" ||
          typeof row.ThoiGianGhiNhan === "number"
          ? new Date(row.ThoiGianGhiNhan).toLocaleTimeString("vi-VN")
          : "--";
        return `${row.TenTB || "Thiết bị"} · ${time}`;
      }),
      datasets: [
        {
          label: "Độ trễ (ms)",
          data: rows.map((row) => numeric(row.DoTre)),
          borderColor: "#1677ff",
          backgroundColor: "rgba(22,119,255,.12)",
          spanGaps: true,
        },
        {
          label: "Mất gói",
          data: rows.map((row) => numeric(row.MatGoi)),
          borderColor: "#ff4d4f",
          backgroundColor: "rgba(255,77,79,.12)",
          spanGaps: true,
        },
      ],
    }),
    [rows],
  );

  return (
    <Card title="Chỉ số hiệu suất mới nhất">
      <div style={{ height: 300 }}>
        <Line
          data={data}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: "bottom" } },
            scales: { y: { beginAtZero: true } },
          }}
        />
      </div>
    </Card>
  );
}

function numeric(value: number | string | null | undefined): number | null {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
