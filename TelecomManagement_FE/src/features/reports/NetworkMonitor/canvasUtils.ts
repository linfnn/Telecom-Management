import type { GlobalToken } from "antd";
import type {
  MonitorDevice,
  MonitorLink,
} from "../../../api/networkMonitorApi";

let token: GlobalToken | undefined;
export const setCanvasToken = (t: GlobalToken) => {
    token = t;
};

export function topologyDeviceKind(device: MonitorDevice): string {
  const type = String(device?.LoaiTB || "").toLowerCase();
  if (type.includes("firewall") || type.includes("asa")) return "firewall";
  if (type.includes("cloud") || type.includes("đám mây") || type.includes("internet")) return "cloud";
  if (type.includes("server") || type.includes("máy chủ")) return "server";
  if (type.includes("access point") || type.includes("wifi") || type.includes("wireless")) return "accesspoint";
  if (type.includes("router")) return "router";
  if (type.includes("switch")) return "switch";
  return "device";
}

export function topologyNodeState(device: MonitorDevice) {
  if (device?.CoSuCo || device?.TinhTrang === "Lỗi" || device?.TrangThai === "Lỗi") {
    return { border: token?.colorError || "#ef5350", dot: token?.colorError || "#ef5350", label: "Sự cố" };
  }
  if (device?.TrangThai === "Hoạt động") {
    return { border: token?.colorSuccess || "#36c979", dot: token?.colorSuccess || "#36c979", label: "Hoạt động" };
  }
  return { border: token?.colorWarning || "#f4ad2d", dot: token?.colorWarning || "#f4ad2d", label: "Dự phòng" };
}

export function drawTopologyDeviceGlyph(ctx: CanvasRenderingContext2D, kind: string, x: number, y: number, color: string) {
  ctx.save();
  const blueTop = "#82a9ff";
  const blueFront = "#4774d8";
  const blueSide = "#3157ad";
  const blueDark = "#223f88";
  const line = "#17346f";
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.strokeStyle = line;
  ctx.lineWidth = 1;

  const polygon = (points: number[][], fill: string, stroke: string | null = line) => {
    ctx.beginPath();
    points.forEach(([px, py], index) => (index ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.stroke();
    }
  };

  const drawArrow = (cx: number, cy: number, rotation: number, scale = 1) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation);
    ctx.scale(scale, scale);
    ctx.strokeStyle = "#eef5ff";
    ctx.fillStyle = "#eef5ff";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-7, 0);
    ctx.lineTo(6, 0);
    ctx.stroke();
    polygon(
      [
        [6, 0],
        [1, -3],
        [1, 3],
      ],
      "#eef5ff",
      null
    );
    ctx.restore();
  };

  ctx.shadowColor = "rgba(28,65,137,.32)";
  ctx.shadowBlur = 5;

  if (kind === "router") {
    ctx.fillStyle = blueSide;
    ctx.beginPath();
    ctx.ellipse(x + 29, y + 34, 26, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillRect(x + 3, y + 23, 52, 11);
    ctx.fillStyle = blueTop;
    ctx.beginPath();
    ctx.ellipse(x + 29, y + 23, 26, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    drawArrow(x + 29, y + 23, 0, 0.75);
    drawArrow(x + 29, y + 23, Math.PI, 0.75);
    drawArrow(x + 29, y + 23, Math.PI / 2, 0.62);
    drawArrow(x + 29, y + 23, -Math.PI / 2, 0.62);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x + 50, y + 35, 2.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === "switch") {
    polygon([[x + 4, y + 20], [x + 31, y + 5], [x + 56, y + 20], [x + 29, y + 36]], blueTop);
    polygon([[x + 4, y + 20], [x + 29, y + 36], [x + 29, y + 44], [x + 4, y + 29]], blueSide);
    polygon([[x + 29, y + 36], [x + 56, y + 20], [x + 56, y + 29], [x + 29, y + 44]], blueFront);
    drawArrow(x + 20, y + 20, -Math.PI / 5, 0.58);
    drawArrow(x + 40, y + 20, Math.PI + Math.PI / 5, 0.58);
    drawArrow(x + 29, y + 13, Math.PI / 2, 0.5);
    drawArrow(x + 30, y + 29, -Math.PI / 2, 0.5);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x + 50, y + 29, 2, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === "firewall") {
    ctx.save();
    ctx.translate(0, -4);
    ctx.fillStyle = blueTop;
    ctx.beginPath();
    ctx.moveTo(x + 27, y + 23);
    ctx.bezierCurveTo(x + 20, y + 17, x + 23, y + 10, x + 29, y + 5);
    ctx.bezierCurveTo(x + 28, y + 11, x + 34, y + 10, x + 35, y + 1);
    ctx.bezierCurveTo(x + 45, y + 10, x + 43, y + 19, x + 36, y + 24);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#416bbd";
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.restore();

    const wall = [[x + 9, y + 20], [x + 45, y + 14], [x + 50, y + 43], [x + 14, y + 49]];
    polygon(wall, blueFront);

    ctx.strokeStyle = "#b9ceff";
    ctx.lineWidth = 1;
    [1, 2, 3].forEach((row) => {
      const t = row / 4;
      const lx = x + 9 + (14 - 9) * t;
      const ly = y + 20 + (49 - 20) * t;
      const rx = x + 45 + (50 - 45) * t;
      const ry = y + 14 + (43 - 14) * t;
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.lineTo(rx, ry);
      ctx.stroke();
    });

    const rows = [
      { top: [[9, 20], [45, 14]], bottom: [[10.25, 27.25], [46.25, 21.25]], cuts: [0.25, 0.55, 0.82] },
      { top: [[10.25, 27.25], [46.25, 21.25]], bottom: [[11.5, 34.5], [47.5, 28.5]], cuts: [0.13, 0.42, 0.70] },
      { top: [[11.5, 34.5], [47.5, 28.5]], bottom: [[12.75, 41.75], [48.75, 35.75]], cuts: [0.25, 0.55, 0.82] },
      { top: [[12.75, 41.75], [48.75, 35.75]], bottom: [[14, 49], [50, 43]], cuts: [0.13, 0.42, 0.70] },
    ];
    rows.forEach((row) =>
      row.cuts.forEach((t) => {
        ctx.beginPath();
        ctx.moveTo(
          x + row.top[0][0] + (row.top[1][0] - row.top[0][0]) * t,
          y + row.top[0][1] + (row.top[1][1] - row.top[0][1]) * t
        );
        ctx.lineTo(
          x + row.bottom[0][0] + (row.bottom[1][0] - row.bottom[0][0]) * t,
          y + row.bottom[0][1] + (row.bottom[1][1] - row.bottom[0][1]) * t
        );
        ctx.stroke();
      })
    );
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x + 47, y + 41, 2, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === "server") {
    polygon([[x + 15, y + 10], [x + 32, y + 1], [x + 48, y + 10], [x + 31, y + 20]], blueTop);
    polygon([[x + 15, y + 10], [x + 31, y + 20], [x + 31, y + 48], [x + 15, y + 38]], blueSide);
    polygon([[x + 31, y + 20], [x + 48, y + 10], [x + 48, y + 38], [x + 31, y + 48]], blueFront);
    ctx.strokeStyle = "#9fbbff";
    ctx.lineWidth = 1;
    [27, 35].forEach((serverY) => {
      ctx.beginPath();
      ctx.moveTo(x + 32, y + serverY);
      ctx.lineTo(x + 47, y + serverY - 8);
      ctx.stroke();
    });
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x + 43, y + 33, 1.8, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === "cloud") {
    ctx.fillStyle = blueFront;
    ctx.strokeStyle = line;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x + 18, y + 30, 11, Math.PI * 0.72, Math.PI * 1.82);
    ctx.arc(x + 30, y + 18, 14, Math.PI, Math.PI * 1.9);
    ctx.arc(x + 45, y + 29, 11, Math.PI * 1.2, Math.PI * 0.35);
    ctx.lineTo(x + 15, y + 41);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,.18)";
    ctx.beginPath();
    ctx.ellipse(x + 29, y + 22, 14, 7, -0.25, Math.PI, Math.PI * 1.9);
    ctx.fill();
  } else if (kind === "accesspoint") {
    ctx.fillStyle = blueFront;
    ctx.beginPath();
    ctx.ellipse(x + 29, y + 34, 24, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = blueTop;
    ctx.lineWidth = 2;
    [8, 14, 20].forEach((radius) => {
      ctx.beginPath();
      ctx.arc(x + 29, y + 28, radius, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
    });
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x + 29, y + 34, 2.2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    polygon([[x + 7, y + 12], [x + 30, y + 5], [x + 30, y + 28], [x + 7, y + 35]], blueTop);
    polygon([[x + 10, y + 15], [x + 27, y + 10], [x + 27, y + 25], [x + 10, y + 30]], blueDark, null);
    polygon([[x + 30, y + 8], [x + 49, y + 16], [x + 49, y + 40], [x + 30, y + 32]], blueFront);
    polygon([[x + 30, y + 8], [x + 39, y + 3], [x + 56, y + 11], [x + 49, y + 16]], blueTop);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x + 43, y + 34, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function truncateTopologyText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const value = String(text || "Thiết bị");
  if (ctx.measureText(value).width <= maxWidth) return value;
  let shortened = value;
  while (shortened.length > 1 && ctx.measureText(shortened + "…").width > maxWidth) {
    shortened = shortened.slice(0, -1);
  }
  return shortened + "…";
}

export function monitorDeviceStatus(device: MonitorDevice) {
  const state = String(device.TrangThai || device.MonitorState || "").trim();
  if (state === "Hoạt động") {
    return { color: token?.colorSuccess || "#32c77b", label: "HOẠT ĐỘNG", level: "online" };
  }
  if (state === "Dự phòng") {
    return { color: token?.colorTextTertiary || "#6f8094", label: "DỰ PHÒNG", level: "warning" };
  }
  return { color: token?.colorWarning || "#ffb52e", label: "CHƯA KHAI BÁO", level: "warning" };
}

export function monitorLinkStyle(status: string) {
  const s = String(status || "").toUpperCase();
  if (s === "UP") return { color: token?.colorSuccess || "#32c77b", dash: [], width: 2, broken: false };
  if (s === "STANDBY") return { color: token?.colorPrimary || "#5f9cff", dash: [7, 5], width: 1.6, broken: false };
  if (s === "DEGRADED") return { color: token?.colorWarning || "#ffb52e", dash: [], width: 2.5, broken: false };
  if (s === "ADMIN_DOWN") return { color: token?.colorTextQuaternary || "#75869a", dash: [5, 6], width: 1.5, broken: true };
  if (s === "CHƯA CÓ DỮ LIỆU" || s === "UNKNOWN") return { color: token?.colorTextTertiary || "#6f8094", dash: [5, 5], width: 1.5, broken: false };
  return { color: token?.colorError || "#ef5350", dash: [3, 4], width: 2.2, broken: true };
}

type TopologyNode = {
  x: number;
  y: number;
  width: number;
  height: number;
  device: MonitorDevice;
  selected: boolean;
};

export function drawTopologyNode(
  ctx: CanvasRenderingContext2D,
  node: TopologyNode,
) {
  const { x, y, width, height, device, selected } = node;
  const state = topologyNodeState(device);
  ctx.save();
  if (selected) {
    ctx.strokeStyle = "#6ea7ff";
    ctx.lineWidth = 1.4;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.roundRect(x + 2, y + 2, width - 4, height - 4, 8);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  drawTopologyDeviceGlyph(ctx, topologyDeviceKind(device), x + 12, y + 18, state.border);
  ctx.fillStyle = state.dot;
  ctx.beginPath();
  ctx.arc(x + 67, y + 18, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = token?.colorText || "#edf4fc";
  ctx.textAlign = "left";
  ctx.font = "600 12px Inter, Segoe UI, sans-serif";
  ctx.textBaseline = "middle";
  ctx.fillText(truncateTopologyText(ctx, device.TenTB, width - 84), x + 76, y + 31);
  ctx.fillStyle = token?.colorTextSecondary || "#91a4ba";
  ctx.font = "10px Inter, Segoe UI, sans-serif";
  ctx.fillText(truncateTopologyText(ctx, device.DiaChiIP || device.LoaiTB || state.label, width - 84), x + 76, y + 51);
  ctx.fillStyle = state.border;
  ctx.font = "600 9px Inter, Segoe UI, sans-serif";
  ctx.fillText(state.label.toUpperCase(), x + 12, y + height - 11);
  ctx.restore();
}

export function drawMonitorNode(
  ctx: CanvasRenderingContext2D,
  device: MonitorDevice,
  x: number,
  y: number,
  selected: boolean,
) {
  const status = monitorDeviceStatus(device);
  ctx.save();

  if (
      device.AttackType ||
      String(device.MonitorState).toUpperCase() === "ATTACK"
  ) {
      ctx.save();

      // Vùng đỏ mờ lớn
      ctx.fillStyle = "rgba(239, 62, 80, 0.10)";
      ctx.beginPath();
      ctx.arc(x, y, 40, 0, Math.PI * 2);
      ctx.fill();

      // Vùng đỏ trung tâm
      ctx.fillStyle = "rgba(239, 62, 80, 0.14)";
      ctx.beginPath();
      ctx.arc(x, y, 32, 0, Math.PI * 2);
      ctx.fill();

      // Viền đỏ mờ
      ctx.strokeStyle = "rgba(239, 62, 80, 0.35)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 32, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
  }

  if (selected) {
    ctx.strokeStyle = "#68a2ff";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(x - 39, y - 43, 78, 100);
    ctx.setLineDash([]);
  }
  drawTopologyDeviceGlyph(ctx, topologyDeviceKind(device), x - 29, y - 30, status.color);
  if (device.AttackType) {
    ctx.fillStyle = token?.colorError || "#ef3e50";
    ctx.beginPath();
    ctx.arc(x + 31, y - 29, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = token?.colorTextLightSolid || "#fff";
    ctx.font = "700 10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("!", x + 31, y - 25);
  } else if (Number(device.CPUPercent) >= 85 || Number(device.RAMPercent) >= 90) {
    ctx.fillStyle = token?.colorWarning || "#ffb52e";
    ctx.beginPath();
    ctx.arc(x + 31, y - 29, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#17212d";
    ctx.font = "700 9px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("!", x + 31, y - 26);
  }
  ctx.fillStyle = token?.colorText || "#edf4fc";
  ctx.font = "600 10px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(truncateTopologyText(ctx, device.TenTB, 110), x, y + 31);
  ctx.fillStyle = token?.colorTextSecondary || "#8ea3ba";
  ctx.font = "8px Inter, sans-serif";
  ctx.fillText(device.DiaChiIP || device.LoaiTB, x, y + 44);
  const pillWidth = 34;
  ctx.fillStyle = device.PowerState === "OFF" ? (token?.colorFillTertiary || "#4a5869") : (token?.colorSuccessBg || "#176e4d");
  ctx.beginPath();
  ctx.roundRect(x - pillWidth / 2, y + 51, pillWidth, 14, 7);
  ctx.fill();
  ctx.fillStyle = device.PowerState === "OFF" ? (token?.colorTextTertiary || "#c7d1dc") : (token?.colorSuccess || "#78edb4");
  ctx.font = "700 7px Inter,sans-serif";
  ctx.fillText(device.PowerState, x, y + 61);
  ctx.fillStyle = status.color;
  ctx.beginPath();
  ctx.arc(x + 24, y + 58, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function pointLineDistance(px: number, py: number, x1: number, y1: number, x2: number, y2: number) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSq = dx * dx + dy * dy;
  if (!lengthSq) return Math.hypot(px - x1, py - y1);
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lengthSq));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

export function topologyAutoPositions(ids: string[], links: MonitorLink[]) {
  const degree = new Map(ids.map((id) => [id, 0]));
  links.forEach((link) => {
    degree.set(String(link.MaTB_Goc), (degree.get(String(link.MaTB_Goc)) || 0) + 1);
    degree.set(String(link.MaTB_Dich), (degree.get(String(link.MaTB_Dich)) || 0) + 1);
  });
  const hubId = [...ids].sort((a, b) => (degree.get(b) || 0) - (degree.get(a) || 0))[0];
  const positions = new Map();
  if (hubId) {
      positions.set(hubId, { x: 0.5, y: 0.5 });
  }
  const peers = ids.filter((id) => id !== hubId);
  peers.forEach((id, index) => {
    const side = index % 2 === 0 ? 0.14 : 0.86;
    const row = Math.floor(index / 2);
    const rowCount = Math.ceil(peers.length / 2);
    positions.set(id, { x: side, y: rowCount > 0 ? (row + 1) / (rowCount + 1) : 0.5 });
  });
  return positions;
}
