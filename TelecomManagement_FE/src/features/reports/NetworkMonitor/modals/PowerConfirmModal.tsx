import {
    CloseOutlined,
    DesktopOutlined,
    PoweroffOutlined,
} from "@ant-design/icons";
import { Button, Flex, Modal, Typography, theme } from "antd";
import React from "react";
import type { MonitorDevice } from "../../../../api/networkMonitorApi";

const { Title, Text } = Typography;

interface PowerConfirmModalProps {
    visible: boolean;
    device: MonitorDevice | null;
    onCancel: () => void;
    onConfirm: () => void;
}

export const PowerConfirmModal: React.FC<PowerConfirmModalProps> = ({
    visible,
    device,
    onCancel,
    onConfirm,
}) => {
    if (!device) return null;
    const isPowerOn = device.PowerState === "ON";
    const { token } = theme.useToken();

    return (
        <Modal
            open={visible}
            onCancel={onCancel}
            footer={null}
            width={500}
            styles={{
                root: {
                    padding: 0,
                    borderTop: isPowerOn
                        ? `6px solid ${token.colorError}`
                        : `6px solid ${token.colorSuccess}`,
                    overflow: "hidden",
                },
                body: { padding: "32px 32px 24px 32px" },
            }}
            closeIcon={null}
        >
            <div style={{ textAlign: "center" }}>
                <div style={{ position: "absolute", top: 16, right: 16 }}>
                    <Button
                        type="text"
                        icon={<CloseOutlined />}
                        onClick={onCancel}
                        style={{ background: token.colorFillAlter, color: token.colorTextSecondary }}
                    />
                </div>

                <Flex
                    justify="center"
                    align="center"
                    style={{
                        width: 96,
                        height: 96,
                        background: isPowerOn ? token.colorErrorBg : token.colorSuccessBg,
                        borderRadius: "50%",
                        margin: "0 auto",
                        border: isPowerOn
                            ? `8px solid ${token.colorErrorBgHover}`
                            : `8px solid ${token.colorSuccessBgHover}`,
                    }}
                >
                    <PoweroffOutlined
                        style={{
                            fontSize: 36,
                            color: isPowerOn ? token.colorError : token.colorSuccess,
                        }}
                    />
                </Flex>

                <Flex vertical style={{ marginTop: 24 }}>
                    <Text
                        strong
                        style={{
                            color: isPowerOn ? token.colorError : token.colorSuccess,
                            fontSize: 12,
                            letterSpacing: 1,
                            textTransform: "uppercase",
                        }}
                    >
                        {isPowerOn
                            ? "Cảnh báo ngắt kết nối"
                            : "Khôi phục kết nối"}
                    </Text>
                    <Title
                        level={2}
                        style={{ margin: "8px 0 12px 0", color: token.colorTextHeading }}
                    >
                        {isPowerOn
                            ? "Tắt nguồn thiết bị?"
                            : "Bật nguồn thiết bị?"}
                    </Title>
                    <Text type="secondary" style={{ fontSize: 14 }}>
                        {isPowerOn
                            ? "Thiết bị và các đường truyền liên quan sẽ chuyển sang trạng thái ngoại tuyến."
                            : "Thiết bị sẽ được đưa về trạng thái trực tuyến và kết nối lại các đường truyền."}
                    </Text>
                </Flex>

                <Flex
                    align="center"
                    justify="space-between"
                    style={{
                        marginTop: 24,
                        padding: 16,
                        border: `1px solid ${token.colorBorderSecondary}`,
                        borderRadius: 12,
                        background: token.colorFillQuaternary,
                        textAlign: "left",
                    }}
                >
                    <Flex align="center" gap={16}>
                        <Flex
                            justify="center"
                            align="center"
                            style={{
                                width: 48,
                                height: 48,
                                background: token.colorFillAlter,
                                borderRadius: 10,
                            }}
                        >
                            <DesktopOutlined
                                style={{ color: token.colorPrimary, fontSize: 24 }}
                            />
                        </Flex>
                        <Flex vertical>
                            <Title
                                level={5}
                                style={{ margin: 0, color: token.colorTextHeading }}
                            >
                                {device.TenTB}
                            </Title>
                            <Text
                                type="secondary"
                                style={{ fontSize: 13, marginTop: 2 }}
                            >
                                {device.LoaiTB} · IP: {device.DiaChiIP || "--"}
                            </Text>
                        </Flex>
                    </Flex>
                    <Flex vertical align="flex-end">
                        <Text
                            type="secondary"
                            style={{ fontSize: 11, textTransform: "uppercase" }}
                        >
                            Sẽ chuyển sang
                        </Text>
                        <Text
                            strong
                            style={{
                                color: isPowerOn ? token.colorError : token.colorSuccess,
                                fontSize: 16,
                            }}
                        >
                            {isPowerOn ? "OFF" : "ON"}
                        </Text>
                    </Flex>
                </Flex>

                <Flex gap={12} style={{ marginTop: 32 }}>
                    <Button
                        size="large"
                        onClick={onCancel}
                        style={{
                            flex: 1,
                            height: 44,
                            fontWeight: 600,
                            color: token.colorTextSecondary,
                            background: token.colorFillAlter,
                            border: "none",
                        }}
                    >
                        Hủy bỏ
                    </Button>
                    <Button
                        size="large"
                        type="primary"
                        danger={isPowerOn}
                        onClick={onConfirm}
                        style={{
                            flex: 1,
                            height: 44,
                            fontWeight: 600,
                            background: isPowerOn ? token.colorError : token.colorSuccess,
                            border: "none",
                        }}
                    >
                        {isPowerOn ? "Tắt nguồn ngay" : "Bật nguồn thiết bị"}
                    </Button>
                </Flex>
            </div>
        </Modal>
    );
};
