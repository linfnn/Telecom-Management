import {
    ApiOutlined,
    CheckCircleOutlined,
    CheckOutlined,
    CloseCircleOutlined,
    CopyOutlined,
    EditOutlined,
    ExclamationCircleOutlined,
    ExclamationOutlined,
    InfoCircleOutlined,
    LinkOutlined,
    PartitionOutlined,
    PoweroffOutlined,
    RightOutlined,
    ThunderboltOutlined,
} from "@ant-design/icons";
import {
    Button,
    Card,
    Col,
    Descriptions,
    Divider,
    Empty,
    Flex,
    message,
    Progress,
    Row,
    Spin,
    Tag,
    theme,
    Typography,
} from "antd";
import React, { useState } from "react";
import {
    runDeviceDiagnostics,
    type DiagnosticsResponse,
    type MonitorDevice,
    type MonitorLink,
} from "../../../api/networkMonitorApi";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

const { Text } = Typography;

interface InspectorPaneProps {
    selectedItem: { type: "device" | "link"; id: string } | null;
    devices: MonitorDevice[];
    links: MonitorLink[];
    onEditProfile: (device: MonitorDevice) => void;
    onConfigIp: (device: MonitorDevice) => void;
    onPowerToggle: (device: MonitorDevice) => void;
}

export const InspectorPane: React.FC<InspectorPaneProps> = ({
    selectedItem,
    devices,
    links,
    onEditProfile,
    onConfigIp,
    onPowerToggle,
}) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { token } = theme.useToken();
    const [diagnosticsState, setDiagnosticsState] = useState<{
        itemId: string | null;
        isDiagnosing: boolean;
        result: DiagnosticsResponse | null;
        error: string | null;
    }>({
        itemId: null,
        isDiagnosing: false,
        result: null,
        error: null,
    });
    const isCurrentSelection =
        selectedItem?.type === "device" &&
        diagnosticsState.itemId === selectedItem.id;
    const isDiagnosing =
        isCurrentSelection && diagnosticsState.isDiagnosing;
    const diagnosticsResult = isCurrentSelection
        ? diagnosticsState.result
        : null;
    const diagnosticsError = isCurrentSelection
        ? diagnosticsState.error
        : null;

    const handleDiagnostics = async (deviceId: string | number) => {
        const itemId = String(deviceId);
        setDiagnosticsState({
            itemId,
            isDiagnosing: true,
            result: null,
            error: null,
        });
        try {
            const data = await runDeviceDiagnostics(deviceId);
            setDiagnosticsState((previous) =>
                previous.itemId === itemId
                    ? { ...previous, result: data }
                    : previous,
            );
        } catch (error: unknown) {
            setDiagnosticsState((previous) =>
                previous.itemId === itemId
                    ? {
                          ...previous,
                          error:
                              error instanceof Error
                                  ? error.message
                                  : t(
                                        "dashboard.network_monitor.inspector.err_diagnose_fail",
                                    ),
                      }
                    : previous,
            );
        } finally {
            setDiagnosticsState((previous) =>
                previous.itemId === itemId
                    ? { ...previous, isDiagnosing: false }
                    : previous,
            );
        }
    };

    if (!selectedItem) {
        return (
            <Card
                style={{
                    height: "100%",
                    overflowY: "auto",
                    overflowX: "hidden",
                }}
                styles={{ body: { padding: 20, height: "100%" } }}
            >
                <Empty description={t("dashboard.network_monitor.inspector.empty")} />
            </Card>
        );
    }

    if (selectedItem.type === "device") {
        const device = devices.find(
            (d) => String(d.MaMonitor) === selectedItem.id,
        );
        if (!device) return null;

        const isOnline = device.MonitorState === "Hoạt động";
        const cpuPercent = device.CPUPercent;
        const cpuColor =
            cpuPercent != null && cpuPercent > 85
                ? token.colorError
                : cpuPercent != null && cpuPercent >= 70
                  ? token.colorWarning
                  : token.colorSuccess;

        const ramPercent = device.RAMPercent;
        const ramColor =
            ramPercent != null && ramPercent > 90
                ? token.colorError
                : ramPercent != null && ramPercent >= 75
                  ? token.colorWarning
                  : token.colorSuccess;

        return (
            <Card
                style={{
                    height: "100%",
                    overflowY: "auto",
                    overflowX: "hidden",
                }}
                styles={{ body: { padding: 12, height: "100%" } }}
            >
                <Flex vertical style={{ height: "100%" }}>
                    {/* Header */}
                    <Flex align="center" justify="space-between">
                        <Flex align="center" gap={12}>
                            <Flex
                                justify="center"
                                align="center"
                                style={{
                                    width: 40,
                                    height: 40,
                                    background: token.colorBgLayout,
                                    border: `1px solid ${token.colorPrimaryBorder}`,
                                    borderRadius: 12,
                                }}
                            >
                                <ApiOutlined
                                    style={{
                                        fontSize: 24,
                                        color: token.colorPrimary,
                                    }}
                                />
                            </Flex>
                            <Flex vertical>
                                <Text
                                    strong
                                    style={{
                                        fontSize: 12,
                                        color: token.colorText,
                                        marginBottom: 2,
                                    }}
                                >
                                    {device.TenTB}
                                </Text>
                                <Text type="secondary" style={{ fontSize: 10 }}>
                                    {device.LoaiTB} ·{" "}
                                    {device.DiaChiIP || t("dashboard.network_monitor.inspector.no_ip")}
                                </Text>
                            </Flex>
                        </Flex>
                        <Tag
                            color={isOnline ? "success" : "error"}
                            style={{
                                margin: 0,
                                fontWeight: 700,
                                letterSpacing: 0.5,
                                padding: "2px 8px",
                                borderRadius: 12,
                            }}
                        >
                            {device.MonitorState}
                        </Tag>
                    </Flex>

                    <Divider
                        style={{
                            margin: "12px 0",
                            borderColor: token.colorBorderSecondary,
                        }}
                    />

                    {/* Metrics Grid */}
                    <Row gutter={[12, 12]}>
                        <Col span={12}>
                            <div
                                style={{
                                    background: token.colorBgLayout,
                                    border: `1px solid ${token.colorBorderSecondary}`,
                                    padding: 4,
                                    borderRadius: 8,
                                }}
                            >
                                <Text
                                    type="secondary"
                                    style={{
                                        fontSize: 8,
                                        textTransform: "uppercase",
                                        display: "block",
                                        marginBottom: 8,
                                    }}
                                >
                                    CPU
                                </Text>
                                <Text
                                    strong
                                    style={{
                                        fontSize: 12,
                                        display: "block",
                                        marginBottom: 12,
                                    }}
                                >
                                    {cpuPercent == null ? "—" : `${cpuPercent.toFixed(0)}%`}
                                </Text>
                                {cpuPercent != null && <Progress
                                    percent={cpuPercent}
                                    showInfo={false}
                                    size="small"
                                    status="active"
                                    strokeColor={cpuColor}
                                    style={{ margin: 0, lineHeight: 1 }}
                                />}
                            </div>
                        </Col>
                        <Col span={12}>
                            <div
                                style={{
                                    background: token.colorBgLayout,
                                    border: `1px solid ${token.colorBorderSecondary}`,
                                    padding: 4,
                                    borderRadius: 8,
                                }}
                            >
                                <Text
                                    type="secondary"
                                    style={{
                                        fontSize: 8,
                                        textTransform: "uppercase",
                                        display: "block",
                                        marginBottom: 8,
                                    }}
                                >
                                    RAM
                                </Text>
                                <Text
                                    strong
                                    style={{
                                        fontSize: 12,
                                        display: "block",
                                        marginBottom: 12,
                                    }}
                                >
                                    {ramPercent == null ? "—" : `${ramPercent.toFixed(0)}%`}
                                </Text>
                                {ramPercent != null && <Progress
                                    percent={ramPercent}
                                    showInfo={false}
                                    size="small"
                                    status="active"
                                    strokeColor={ramColor}
                                    style={{ margin: 0, lineHeight: 1 }}
                                />}
                            </div>
                        </Col>
                        <Col span={12}>
                            <div
                                style={{
                                    background: token.colorBgLayout,
                                    border: `1px solid ${token.colorBorderSecondary}`,
                                    padding: 4,
                                    borderRadius: 8,
                                }}
                            >
                                <Text
                                    type="secondary"
                                    style={{
                                        fontSize: 8,
                                        textTransform: "uppercase",
                                        display: "block",
                                        marginBottom: 4,
                                    }}
                                >
                                    {t("dashboard.network_monitor.inspector.temp")}
                                </Text>
                                <Text strong style={{ fontSize: 12 }}>
                                    {device.Temperature != null
                                        ? `${device.Temperature}°C`
                                        : "--"}
                                </Text>
                            </div>
                        </Col>
                        <Col span={12}>
                            <div
                                style={{
                                    background: token.colorBgLayout,
                                    border: `1px solid ${token.colorBorderSecondary}`,
                                    padding: 4,
                                    borderRadius: 8,
                                }}
                            >
                                <Text
                                    type="secondary"
                                    style={{
                                        fontSize: 8,
                                        textTransform: "uppercase",
                                        display: "block",
                                        marginBottom: 4,
                                    }}
                                >
                                    {t("dashboard.network_monitor.inspector.uptime")}
                                </Text>
                                <Text strong style={{ fontSize: 12 }}>
                                    {device.UptimeSeconds == null
                                        ? "—"
                                        : `${Math.floor(device.UptimeSeconds / 86400)} ${t("dashboard.network_monitor.inspector.days")}`}
                                </Text>
                            </div>
                        </Col>
                    </Row>

                    {/* Details List */}
                    <Descriptions
                        size="small"
                        column={1}
                        style={{ margin: "12px 0" }}
                        labelStyle={{ fontSize: 11, color: token.colorTextSecondary }}
                        contentStyle={{ fontSize: 11, fontWeight: "bold" }}
                    >
                        <Descriptions.Item label={t("dashboard.network_monitor.inspector.location")}>
                            {device.ViTri || "--"}
                        </Descriptions.Item>
                        <Descriptions.Item label={t("dashboard.network_monitor.inspector.last_response")}>
                            {device.LastSeen
                                ? new Date(device.LastSeen).toLocaleString()
                                : "Chưa có dữ liệu"}
                        </Descriptions.Item>
                        <Descriptions.Item label={t("dashboard.network_monitor.inspector.method")}>
                            Chưa có dữ liệu
                        </Descriptions.Item>
                    </Descriptions>

                    {/* Action Buttons Grid */}
                    <Row gutter={[12, 12]}>
                        <Col span={8}>
                            <Button
                                type="text"
                                onClick={() =>
                                    handleDiagnostics(device.MaMonitor)
                                }
                                loading={isDiagnosing}
                                style={{
                                    width: "100%",
                                    height: "auto",
                                    padding: "12px 8px",
                                    border: `1px solid ${token.colorBorderSecondary}`,
                                    borderRadius: 8,
                                }}
                            >
                                <Flex vertical align="center" gap={8}>
                                    <ThunderboltOutlined
                                        style={{
                                            fontSize: 18,
                                            color: token.colorPrimary,
                                        }}
                                    />
                                    <Text
                                        type="secondary"
                                        style={{ fontSize: 11 }}
                                    >
                                        {t("dashboard.network_monitor.inspector.btn_diagnose")}
                                    </Text>
                                </Flex>
                            </Button>
                        </Col>
                        <Col span={8}>
                            <Button
                                type="text"
                                onClick={() => {
                                    navigator.clipboard.writeText(
                                        device.DiaChiIP || "",
                                    );
                                    message.success(t("dashboard.network_monitor.inspector.msg_copied_ip"));
                                }}
                                style={{
                                    width: "100%",
                                    height: "auto",
                                    padding: "12px 8px",
                                    border: `1px solid ${token.colorBorderSecondary}`,
                                    borderRadius: 8,
                                }}
                            >
                                <Flex vertical align="center" gap={8}>
                                    <CopyOutlined
                                        style={{
                                            fontSize: 18,
                                            color: token.colorPrimary,
                                        }}
                                    />
                                    <Text
                                        type="secondary"
                                        style={{ fontSize: 11 }}
                                    >
                                        {t("dashboard.network_monitor.inspector.btn_copy_ip")}
                                    </Text>
                                </Flex>
                            </Button>
                        </Col>
                        <Col span={8}>
                            <Button
                                type="text"
                                onClick={() => onEditProfile(device)}
                                style={{
                                    width: "100%",
                                    height: "auto",
                                    padding: "12px 8px",
                                    border: `1px solid ${token.colorBorderSecondary}`,
                                    borderRadius: 8,
                                }}
                            >
                                <Flex vertical align="center" gap={8}>
                                    <EditOutlined
                                        style={{
                                            fontSize: 18,
                                            color: token.colorPrimary,
                                        }}
                                    />
                                    <Text
                                        type="secondary"
                                        style={{ fontSize: 11 }}
                                    >
                                        {t("dashboard.network_monitor.inspector.btn_edit")}
                                    </Text>
                                </Flex>
                            </Button>
                        </Col>
                        <Col span={8}>
                            <Button
                                type="text"
                                onClick={() => navigate(`/devices/${device.MaMonitor}`)}
                                style={{
                                    width: "100%",
                                    height: "auto",
                                    padding: "12px 8px",
                                    border: `1px solid ${token.colorBorderSecondary}`,
                                    borderRadius: 8,
                                }}
                            >
                                <Flex vertical align="center" gap={8}>
                                    <InfoCircleOutlined
                                        style={{
                                            fontSize: 18,
                                            color: token.colorPrimary,
                                        }}
                                    />
                                    <Text
                                        type="secondary"
                                        style={{ fontSize: 11 }}
                                    >
                                        {t("dashboard.network_monitor.inspector.btn_details")}
                                    </Text>
                                </Flex>
                            </Button>
                        </Col>
                    </Row>

                    {/* Diagnostics Result */}
                    {(isDiagnosing ||
                        diagnosticsResult ||
                        diagnosticsError) && (
                        <Card
                            size="small"
                            style={{
                                marginTop: 16,
                                background: diagnosticsError
                                    ? token.colorErrorBg
                                    : diagnosticsResult
                                      ? diagnosticsResult.healthy
                                          ? token.colorSuccessBg
                                          : token.colorWarningBg
                                      : token.colorBgLayout,
                                borderColor: diagnosticsError
                                    ? token.colorErrorBorder
                                    : diagnosticsResult
                                      ? diagnosticsResult.healthy
                                          ? token.colorSuccessBorder
                                          : token.colorWarningBorder
                                      : token.colorBorderSecondary,
                            }}
                        >
                            {isDiagnosing && (
                                <Flex
                                    align="center"
                                    gap={8}
                                    style={{ padding: 8 }}
                                >
                                    <Spin size="small" />
                                    <Text
                                        type="secondary"
                                        style={{ fontSize: 12 }}
                                    >
                                        {t("dashboard.network_monitor.inspector.diag_loading")}
                                    </Text>
                                </Flex>
                            )}
                            {diagnosticsError && (
                                <Text type="danger" style={{ fontSize: 12 }}>
                                    {diagnosticsError}
                                </Text>
                            )}
                            {diagnosticsResult && (
                                <Flex vertical gap={12}>
                                    <Flex
                                        justify="space-between"
                                        align="center"
                                    >
                                        <Text
                                            strong
                                            style={{
                                                color: diagnosticsResult.healthy
                                                    ? token.colorSuccess
                                                    : token.colorWarning,
                                            }}
                                        >
                                            {diagnosticsResult.healthy ? (
                                                <CheckCircleOutlined />
                                            ) : (
                                                <ExclamationCircleOutlined />
                                            )}
                                            <span style={{ marginLeft: 8 }}>
                                                {diagnosticsResult.healthy
                                                    ? t("dashboard.network_monitor.inspector.diag_good")
                                                    : diagnosticsResult.status ===
                                                        "OFFLINE"
                                                      ? t("dashboard.network_monitor.inspector.diag_offline")
                                                      : t("dashboard.network_monitor.inspector.diag_warning")}
                                            </span>
                                        </Text>
                                        <Text
                                            type="secondary"
                                            style={{ fontSize: 11 }}
                                        >
                                            {new Date(
                                                diagnosticsResult.checkedAt,
                                            ).toLocaleTimeString("vi-VN", {
                                                hour12: false,
                                            })}
                                        </Text>
                                    </Flex>
                                    <Flex vertical gap={8}>
                                        {diagnosticsResult.checks.map(
                                            (check, idx) => (
                                                <Flex
                                                    key={idx}
                                                    justify="space-between"
                                                    align="center"
                                                    style={{
                                                        padding: "8px 12px",
                                                        background:
                                                            token.colorBgContainer,
                                                        borderRadius: 6,
                                                        border: `1px solid ${check.ok ? token.colorSuccessBorder : check.warning ? token.colorWarningBorder : token.colorErrorBorder}`,
                                                    }}
                                                >
                                                    <Flex
                                                        align="center"
                                                        gap={8}
                                                    >
                                                        {check.ok ? (
                                                            <CheckOutlined
                                                                style={{
                                                                    color: token.colorSuccess,
                                                                }}
                                                            />
                                                        ) : check.warning ? (
                                                            <ExclamationOutlined
                                                                style={{
                                                                    color: token.colorWarning,
                                                                }}
                                                            />
                                                        ) : (
                                                            <CloseCircleOutlined
                                                                style={{
                                                                    color: token.colorError,
                                                                }}
                                                            />
                                                        )}
                                                        <Text
                                                            strong
                                                            style={{
                                                                fontSize: 12,
                                                            }}
                                                        >
                                                            {check.label}
                                                        </Text>
                                                    </Flex>
                                                    <Text
                                                        type="secondary"
                                                        style={{ fontSize: 12 }}
                                                    >
                                                        {check.detail}
                                                    </Text>
                                                </Flex>
                                            ),
                                        )}
                                    </Flex>
                                </Flex>
                            )}
                        </Card>
                    )}

                    {/* IP Config Banner */}
                    <Button
                        type="text"
                        onClick={() => onConfigIp(device)}
                        style={{
                            marginTop: 12,
                            height: "auto",
                            padding: 12,
                            background: token.colorBgLayout,
                            border: `1px solid ${token.colorBorderSecondary}`,
                            borderRadius: 10,
                            width: "100%",
                        }}
                    >
                        <Flex
                            align="center"
                            justify="space-between"
                            style={{ width: "100%" }}
                        >
                            <Flex align="center" gap={12}>
                                <Flex
                                    justify="center"
                                    align="center"
                                    style={{
                                        width: 40,
                                        height: 40,
                                        background: token.colorBgContainer,
                                        border: `1px solid ${token.colorBorderSecondary}`,
                                        borderRadius: 8,
                                    }}
                                >
                                    <PartitionOutlined
                                        style={{
                                            fontSize: 20,
                                            color: token.colorPrimary,
                                        }}
                                    />
                                </Flex>
                                <Flex vertical align="start">
                                    <Text strong style={{ fontSize: 13 }}>
                                        {t("dashboard.network_monitor.inspector.ip_config")}
                                    </Text>
                                    <Text
                                        type="secondary"
                                        style={{ fontSize: 11, marginTop: 2 }}
                                    >
                                        {t("dashboard.network_monitor.inspector.ip_config_desc")}
                                    </Text>
                                </Flex>
                            </Flex>
                            <RightOutlined
                                style={{
                                    color: token.colorTextSecondary,
                                    fontSize: 12,
                                }}
                            />
                        </Flex>
                    </Button>

                    <Divider
                        style={{
                            margin: "12px 0",
                            borderColor: token.colorBorderSecondary,
                        }}
                    />

                    {/* Power Control */}
                    <Flex
                        align="center"
                        justify="space-between"
                        style={{ marginTop: "auto" }}
                    >
                        <Flex
                            align="center"
                            gap={8}
                            style={{
                                color: token.colorTextSecondary,
                                fontSize: 13,
                            }}
                        >
                            <PoweroffOutlined style={{ fontSize: 16 }} /> {t("dashboard.network_monitor.inspector.power_control")}
                        </Flex>
                        <Button
                            onClick={() => onPowerToggle(device)}
                            type="primary"
                            danger={device.PowerState === "ON"}
                            style={{
                                borderRadius: 8,
                                fontWeight: 700,
                                width: 80,
                                height: 36,
                            }}
                        >
                            {device.PowerState === "ON" ? t("dashboard.network_monitor.inspector.btn_off") : t("dashboard.network_monitor.inspector.btn_on")}
                        </Button>
                    </Flex>
                </Flex>
            </Card>
        );
    } else {
        const link = links.find((l) => String(l.MaLK) === selectedItem.id);
        if (!link) return null;
        const source = devices.find(
            (d) => String(d.MaMonitor) === String(link.MaTB_Goc),
        );
        const target = devices.find(
            (d) => String(d.MaMonitor) === String(link.MaTB_Dich),
        );

        return (
            <Card
                style={{ height: "100%", overflowY: "auto" }}
                styles={{ body: { padding: 12, height: "100%" } }}
            >
                <Flex align="center" justify="space-between">
                    <Flex align="center" gap={12}>
                        <Flex
                            justify="center"
                            align="center"
                            style={{
                                width: 56,
                                height: 56,
                                background: token.colorBgLayout,
                                border: `1px solid ${token.colorPrimaryBorder}`,
                                borderRadius: 12,
                            }}
                        >
                            <LinkOutlined
                                style={{
                                    fontSize: 28,
                                    color: token.colorPrimary,
                                }}
                            />
                        </Flex>
                        <Flex vertical>
                            <Text
                                strong
                                style={{
                                    fontSize: 18,
                                    color: token.colorText,
                                    marginBottom: 2,
                                }}
                            >
                                Cable #{link.MaLK}
                            </Text>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                {source?.TenTB} ↔ {target?.TenTB}
                            </Text>
                        </Flex>
                    </Flex>
                    <Tag
                        color={
                            link.TrangThai === "UP"
                                ? "success"
                                : link.TrangThai === "DEGRADED"
                                  ? "warning"
                                  : "default"
                        }
                        style={{
                            margin: 0,
                            fontWeight: 700,
                            letterSpacing: 0.5,
                            padding: "2px 8px",
                            borderRadius: 12,
                        }}
                    >
                        Trạng thái chưa được cung cấp
                    </Tag>
                </Flex>

                <Divider
                    style={{
                        margin: "12px 0",
                        borderColor: token.colorBorderSecondary,
                    }}
                />

                <Row gutter={[12, 12]}>
                    <Col span={12}>
                        <div
                            style={{
                                background: token.colorBgLayout,
                                border: `1px solid ${token.colorBorderSecondary}`,
                                padding: 8,
                                borderRadius: 8,
                            }}
                        >
                            <Text
                                type="secondary"
                                style={{
                                    fontSize: 8,
                                    textTransform: "uppercase",
                                    display: "block",
                                    marginBottom: 8,
                                }}
                            >
                                {t("dashboard.network_monitor.inspector.speed")}
                            </Text>
                            <Text
                                strong
                                style={{
                                    fontSize: 12,
                                    display: "block",
                                    marginBottom: 12,
                                }}
                            >
                                {link.BangThongToiDa ?? "—"} Mbps
                            </Text>
                        </div>
                    </Col>
                    <Col span={12}>
                        <div
                            style={{
                                background: token.colorBgLayout,
                                border: `1px solid ${token.colorBorderSecondary}`,
                                padding: 8,
                                borderRadius: 8,
                            }}
                        >
                            <Text
                                type="secondary"
                                style={{
                                    fontSize: 8,
                                    textTransform: "uppercase",
                                    display: "block",
                                    marginBottom: 8,
                                }}
                            >
                                {t("dashboard.network_monitor.inspector.traffic")}
                            </Text>
                            <Text
                                strong
                                style={{
                                    fontSize: 12,
                                    display: "block",
                                    marginBottom: 12,
                                }}
                            >
                                —
                            </Text>
                        </div>
                    </Col>
                    <Col span={12}>
                        <div
                            style={{
                                background: token.colorBgLayout,
                                border: `1px solid ${token.colorBorderSecondary}`,
                                padding: 8,
                                borderRadius: 8,
                            }}
                        >
                            <Text
                                type="secondary"
                                style={{
                                    fontSize: 8,
                                    textTransform: "uppercase",
                                    display: "block",
                                    marginBottom: 8,
                                }}
                            >
                                {t("dashboard.network_monitor.inspector.latency")}
                            </Text>
                            <Text
                                strong
                                style={{
                                    fontSize: 12,
                                    display: "block",
                                    marginBottom: 12,
                                }}
                            >
                                —
                            </Text>
                        </div>
                    </Col>
                    <Col span={12}>
                        <div
                            style={{
                                background: token.colorBgLayout,
                                border: `1px solid ${token.colorBorderSecondary}`,
                                padding: 8,
                                borderRadius: 8,
                            }}
                        >
                            <Text
                                type="secondary"
                                style={{
                                    fontSize: 8,
                                    textTransform: "uppercase",
                                    display: "block",
                                    marginBottom: 8,
                                }}
                            >
                                {t("dashboard.network_monitor.inspector.packet_loss")}
                            </Text>
                            <Text
                                strong
                                style={{
                                    fontSize: 12,
                                    display: "block",
                                    marginBottom: 12,
                                }}
                            >
                                —
                            </Text>
                        </div>
                    </Col>
                </Row>

                <Text type="secondary" style={{ display: "block", marginTop: 16 }}>
                    Trạng thái realtime và điều khiển liên kết chưa được backend hỗ trợ.
                </Text>
            </Card>
        );
    }
};
