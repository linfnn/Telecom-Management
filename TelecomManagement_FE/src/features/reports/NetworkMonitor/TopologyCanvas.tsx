import { Spin, theme } from "antd";
import React, { useCallback, useEffect, useRef } from "react";
import type {
    MonitorDevice,
    MonitorLink,
} from "../../../api/networkMonitorApi";
import {
    drawMonitorNode,
    monitorLinkStyle,
    pointLineDistance,
    setCanvasToken,
    topologyAutoPositions,
} from "./canvasUtils";

interface TopologyCanvasProps {
    devices: MonitorDevice[];
    links: MonitorLink[];
    selectedItem: { type: "device" | "link"; id: string } | null;
    filter: string;
    hideDown: boolean;
    loading: boolean;
    onSelect: (item: { type: "device" | "link"; id: string } | null) => void;
    onPowerClick: (device: MonitorDevice) => void;
    onPositionChange: (
        device: MonitorDevice,
        x: number,
        y: number,
        save: boolean,
    ) => void;
    containerRef: React.RefObject<HTMLDivElement>;
}

type NodeRegion = {
    x: number;
    y: number;
    width: number;
    height: number;
    device: MonitorDevice;
    power: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
};

type LinkRegion = {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    link: MonitorLink;
};

export const TopologyCanvas: React.FC<TopologyCanvasProps> = ({
    devices,
    links,
    selectedItem,
    filter,
    hideDown,
    loading,
    onSelect,
    onPowerClick,
    onPositionChange,
    containerRef,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { token } = theme.useToken();
    setCanvasToken(token);

    const stateRef = useRef({
        devices,
        links,
        selectedItem,
        filter,
        hideDown,
        dragging: null as {
            device: MonitorDevice;
            startX: number;
            startY: number;
            moved: boolean;
        } | null,
        dragPositions: new Map<string, { x: number; y: number }>(),
        nodeRegions: [] as NodeRegion[],
        linkRegions: [] as LinkRegion[],
    });

    useEffect(() => {
        stateRef.current.devices = devices;
        stateRef.current.links = links;
        stateRef.current.selectedItem = selectedItem;
        stateRef.current.filter = filter;
        stateRef.current.hideDown = hideDown;
    }, [devices, links, selectedItem, filter, hideDown]);

    const renderCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const rect = container.getBoundingClientRect();
        if (rect.width < 1 || rect.height < 1) return;

        const dpr = window.devicePixelRatio || 1;
        const width = rect.width;
        const height = rect.height;
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, width, height);

        const {
            devices: curDevices,
            links: curLinks,
            filter: curFilter,
            hideDown: curHideDown,
            selectedItem: curSelected,
        } = stateRef.current;

        stateRef.current.nodeRegions = [];
        stateRef.current.linkRegions = [];

        const visible = curDevices.filter(
            (d) =>
                !curFilter ||
                (curFilter === "WARNING"
                    ? !["ONLINE", "OFFLINE", "ATTACK"].includes(d.MonitorState)
                    : d.MonitorState === curFilter),
        );
        const visibleIdsList = visible.map((d) => String(d.MaMonitor));
        const visibleIds = new Set(visibleIdsList);
        const autoPositions = topologyAutoPositions(visibleIdsList, curLinks);

        const positions = new Map(
            visible.map((d) => {
                const dragPos = stateRef.current.dragPositions.get(
                    String(d.MaMonitor),
                );
                
                let cx = Number(d.ToaDoX) || 0;
                let cy = Number(d.ToaDoY) || 0;
                if (!cx && !cy) {
                    const ap = autoPositions.get(String(d.MaMonitor));
                    if (ap) {
                        cx = ap.x;
                        cy = ap.y;
                    } else {
                        cx = 0.5;
                        cy = 0.5;
                    }
                }
                
                return [
                    String(d.MaMonitor),
                    dragPos || {
                        x: cx * width,
                        y: cy * height,
                    },
                ];
            }),
        );

        curLinks.forEach((link) => {
            if (
                !visibleIds.has(String(link.MaTB_Goc)) ||
                !visibleIds.has(String(link.MaTB_Dich))
            )
                return;
            if (
                curHideDown &&
                ["DOWN", "ADMIN_DOWN", "DEVICE_DOWN"].includes(link.TrangThai)
            )
                return;

            const a = positions.get(String(link.MaTB_Goc));
            const b = positions.get(String(link.MaTB_Dich));
            const style = monitorLinkStyle(link.TrangThai);
            if (!a || !b) return;

            const isSelected =
                curSelected?.type === "link" &&
                String(curSelected.id) === String(link.MaLK);

            ctx.save();
            ctx.strokeStyle = isSelected ? token.colorPrimary : style.color;
            ctx.lineWidth = isSelected ? style.width + 1 : style.width;
            ctx.setLineDash(style.dash);
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
            ctx.restore();

            const mx = (a.x + b.x) / 2;
            const my = (a.y + b.y) / 2;

            if (style.broken) {
                ctx.save();
                ctx.strokeStyle = token.colorError;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(mx - 7, my - 7);
                ctx.lineTo(mx + 7, my + 7);
                ctx.moveTo(mx + 7, my - 7);
                ctx.lineTo(mx - 7, my + 7);
                ctx.stroke();
                ctx.restore();
            }

            const label = `${link.TenTB_Goc || `Thiết bị ${link.MaTB_Goc}`} ↔ ${link.TenTB_Dich || `Thiết bị ${link.MaTB_Dich}`} · ${link.TrangThai}`;
            ctx.font = "7px Inter,sans-serif";
            const lw = ctx.measureText(label).width + 10;
            ctx.fillStyle = token.colorBgElevated;
            ctx.fillRect(mx - lw / 2, my + 8, lw, 14);
            ctx.fillStyle = style.color;
            ctx.textAlign = "center";
            ctx.fillText(label, mx, my + 18);

            stateRef.current.linkRegions.push({
                x1: a.x,
                y1: a.y,
                x2: b.x,
                y2: b.y,
                link,
            });
        });

        visible.forEach((device) => {
            const pos = positions.get(String(device.MaMonitor));
            if (pos) {
                const isSelected =
                    curSelected?.type === "device" &&
                    String(curSelected.id) === String(device.MaMonitor);
                drawMonitorNode(ctx, device, pos.x, pos.y, isSelected);
                stateRef.current.nodeRegions.push({
                    x: pos.x - 43,
                    y: pos.y - 42,
                    width: 86,
                    height: 110,
                    device,
                    power: {
                        x: pos.x - 20,
                        y: pos.y + 49,
                        width: 40,
                        height: 18,
                    },
                });
            }
        });
    }, [containerRef, token]);

    useEffect(() => {
        const handleResize = () => {
            requestAnimationFrame(renderCanvas);
        };

        window.addEventListener("resize", handleResize);

        const container = containerRef.current;
        let observer: ResizeObserver | null = null;
        if (container) {
            observer = new ResizeObserver(handleResize);
            observer.observe(container);
        }

        renderCanvas();

        return () => {
            window.removeEventListener("resize", handleResize);
            if (observer && container) {
                observer.unobserve(container);
            }
        };
    }, [containerRef, renderCanvas]);

    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const node = stateRef.current.nodeRegions.find(
            (n) =>
                x >= n.x &&
                x <= n.x + n.width &&
                y >= n.y &&
                y <= n.y + n.height,
        );
        if (node) {
            stateRef.current.dragging = {
                device: node.device,
                startX: x,
                startY: y,
                moved: false,
            };
            canvas.setPointerCapture(e.pointerId);
        }
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const drag = stateRef.current.dragging;
        if (drag) {
            drag.moved =
                drag.moved || Math.hypot(x - drag.startX, y - drag.startY) > 3;

            const newX = Math.min(0.96, Math.max(0.04, x / rect.width));
            const newY = Math.min(0.93, Math.max(0.07, y / rect.height));
            stateRef.current.dragPositions.set(String(drag.device.MaMonitor), {
                x: newX * rect.width,
                y: newY * rect.height,
            });
            renderCanvas();
            return;
        }

        const isOverNode = stateRef.current.nodeRegions.some(
            (n) => x >= n.x && x <= n.x + n.width && y >= n.y && y <= n.y + n.height
        );
        const isOverLink = stateRef.current.linkRegions.some(
            (r) => pointLineDistance(x, y, r.x1, r.y1, r.x2, r.y2) < 8
        );

        canvas.style.cursor = isOverNode || isOverLink ? "pointer" : "default";
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const drag = stateRef.current.dragging;
        const canvas = canvasRef.current;

        if (drag) {
            stateRef.current.dragging = null;
            stateRef.current.dragPositions.delete(
                String(drag.device.MaMonitor),
            );
            if (canvas) canvas.releasePointerCapture(e.pointerId);

            if (drag.moved) {
                const rect = canvas?.getBoundingClientRect();
                if (rect) {
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    const newX = Math.min(0.96, Math.max(0.04, x / rect.width));
                    const newY = Math.min(
                        0.93,
                        Math.max(0.07, y / rect.height),
                    );
                    onPositionChange(drag.device, newX, newY, true);
                }
                return;
            }
        }

        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const node = stateRef.current.nodeRegions.find(
            (n) =>
                x >= n.x &&
                x <= n.x + n.width &&
                y >= n.y &&
                y <= n.y + n.height,
        );
        if (node) {
            if (
                x >= node.power.x &&
                x <= node.power.x + node.power.width &&
                y >= node.power.y &&
                y <= node.power.y + node.power.height
            ) {
                onPowerClick(node.device);
                return;
            }

            onSelect({ type: "device", id: String(node.device.MaMonitor) });
            return;
        }

        const link = stateRef.current.linkRegions.find(
            (r) => pointLineDistance(x, y, r.x1, r.y1, r.x2, r.y2) < 8,
        );
        if (link) {
            onSelect({ type: "link", id: String(link.link.MaLK) });
        } else {
            onSelect(null);
        }
    };

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
                borderRadius: 8,
                background: token.colorBgLayout,
                border: `1px solid ${token.colorBorderSecondary}`,
                backgroundImage: `radial-gradient(${token.colorBorder} 1px, transparent 0)`,
                backgroundSize: "20px 20px",
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    display: "block",
                    width: "100%",
                    height: "100%",
                    touchAction: "none",
                }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
            />
            {loading && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        background: token.colorBgMask,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        zIndex: 10,
                    }}
                >
                    <Spin size="large" />
                </div>
            )}
        </div>
    );
};
