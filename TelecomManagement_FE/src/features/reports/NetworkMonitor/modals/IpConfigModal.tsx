import React, { useState } from "react";
import { Modal, Form, Input, Button, Typography, Flex, message, theme } from "antd";
import type { FormInstance } from "antd";
import { ClusterOutlined, SafetyCertificateOutlined, WifiOutlined } from "@ant-design/icons";
import type {
  IpValidationResponse,
  MonitorDevice,
} from "../../../../api/networkMonitorApi";

const { Text, Title } = Typography;

interface IpConfigModalProps {
  visible: boolean;
  device?: MonitorDevice;
  form: FormInstance<IpConfigFormValues>;
  onCancel: () => void;
  onSubmit: () => void;
  onCheckIp?: (ip: string) => Promise<IpValidationResponse>;
}

type IpConfigFormValues = {
  ip: string;
};

export const IpConfigModal: React.FC<IpConfigModalProps> = ({ visible, device, form, onCancel, onSubmit, onCheckIp }) => {
  const { token } = theme.useToken();
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<IpValidationResponse | null>(null);

  const handleCheck = async () => {
    try {
      const { ip } = await form.validateFields(["ip"]);
      if (!ip || !onCheckIp) return;
      setChecking(true);
      const val = await onCheckIp(ip);
      setCheckResult(val);
    } catch (error: unknown) {
      if (
        typeof error === "object" &&
        error !== null &&
        "errorFields" in error
      ) {
        return;
      }
      message.error(
        error instanceof Error ? error.message : "Không thể kiểm tra địa chỉ IP.",
      );
    } finally {
      setChecking(false);
    }
  };

  return (
    <Modal
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={700}
      styles={{
        body: { padding: '32px 32px 24px 32px' }
      }}
      closable={true}
    >
      <Flex gap={16} align="flex-start" style={{ marginBottom: 28 }}>
        <Flex
          justify="center"
          align="center"
          style={{
            width: 72,
            height: 72,
            background: token.colorPrimaryBg,
            borderRadius: 16,
            color: token.colorPrimary,
            fontSize: 32,
          }}
        >
          <ClusterOutlined />
        </Flex>
        <Flex vertical gap={4}>
          <Text style={{ color: token.colorPrimary, fontSize: 12, fontWeight: 800, letterSpacing: 0.5, textTransform: 'uppercase' }}>
            Network Configuration
          </Text>
          <Title level={3} style={{ margin: 0, fontWeight: 800, color: token.colorText }}>
            Thay đổi địa chỉ IP
          </Title>
          <Text type="secondary" style={{ fontSize: 14 }}>
            {device
              ? `${device.TenTB} • ${device.LoaiTB || "Thiết bị"}`
              : "Đang tải..."}
          </Text>
        </Flex>
      </Flex>

      <Form<IpConfigFormValues> form={form} layout="vertical">
        <Flex vertical gap={20}>
          {/* Current IP */}
          <Flex vertical gap={8}>
            <Text style={{ fontWeight: 800, fontSize: 14, color: token.colorText }}>Địa chỉ hiện tại</Text>
            <div style={{
              padding: '12px 16px',
              background: token.controlItemBgActive,
              border: `1px solid ${token.colorPrimaryBorder}`,
              borderRadius: 8,
              fontSize: 15,
              color: token.colorTextSecondary,
              minHeight: 46,
              display: 'flex',
              alignItems: 'center'
            }}>
              {device?.DiaChiIP || 'N/A'}
            </div>
          </Flex>

          {/* New IP Input */}
          <Flex vertical gap={8}>
             <Text style={{ fontWeight: 800, fontSize: 14, color: token.colorText }}>
               Địa chỉ IP mới <span style={{ color: token.colorError }}>*</span>
             </Text>
             <Flex gap={12}>
               <Form.Item name="ip" rules={[{ required: true, message: 'Vui lòng nhập IP mới' }]} style={{ margin: 0, flex: 1 }}>
                 <Input 
                   size="large" 
                   style={{ borderRadius: 8, height: 48, fontSize: 15 }} 
                 />
               </Form.Item>
               <Button 
                 type="primary" 
                 size="large" 
                 icon={<SafetyCertificateOutlined />} 
                 onClick={handleCheck}
                 loading={checking}
                 style={{ height: 48, borderRadius: 8, fontWeight: 700, width: 140 }}
               >
                 Kiểm tra
               </Button>
             </Flex>
             
             {/* Check indicators */}
             <Flex gap={12} style={{ marginTop: 4 }}>
                {[
                  { text: "Định dạng IPv4", passed: checkResult ? checkResult.code !== "INVALID_FORMAT" : null },
                  { text: "Không trùng địa chỉ", passed: checkResult ? checkResult.code !== "DUPLICATE" : null },
                  { text: "Phù hợp subnet/VLAN", passed: checkResult ? checkResult.compatible : null }
                ].map((item, idx) => (
                  <Flex 
                    key={idx} 
                    align="center" 
                    gap={8} 
                    style={{ 
                      flex: 1, 
                      padding: '10px 12px', 
                      background: item.passed === true ? token.colorSuccessBg : item.passed === false ? token.colorErrorBg : token.colorFillAlter, 
                      border: `1px solid ${item.passed === true ? token.colorSuccessBorder || token.colorSuccess : item.passed === false ? token.colorErrorBorder || token.colorError : token.colorBorderSecondary}`,
                      borderRadius: 8 
                    }}
                  >
                    <div style={{ 
                      width: 12, 
                      height: 12, 
                      borderRadius: '50%', 
                      border: `2px solid ${item.passed === true ? token.colorSuccess : item.passed === false ? token.colorError : token.colorTextQuaternary}`,
                      background: item.passed === true ? token.colorSuccess : item.passed === false ? token.colorError : 'transparent'
                    }} />
                    <Text style={{ fontSize: 12, color: item.passed === true ? token.colorSuccess : item.passed === false ? token.colorError : token.colorTextSecondary }}>{item.text}</Text>
                  </Flex>
                ))}
             </Flex>
          </Flex>

          {/* Footer note */}
          <Flex align="center" gap={8} style={{ marginTop: 8 }}>
            <WifiOutlined style={{ color: token.colorPrimary, fontSize: 16 }} />
            <Text type="secondary" style={{ fontSize: 13 }}>
              Sau khi áp dụng, SNMP/ICMP sẽ xác nhận khả năng kết nối thực tế ở chu kỳ tiếp theo.
            </Text>
          </Flex>
          
          <Flex justify="flex-end" gap={12} style={{ marginTop: 16 }}>
            <Button size="large" onClick={onCancel} style={{ borderRadius: 8, width: 120, fontWeight: 700, height: 44 }}>
              Hủy
            </Button>
            <Button 
              type="primary" 
              size="large" 
              onClick={onSubmit} 
              style={{ borderRadius: 8, width: 140, fontWeight: 700, height: 44 }} 
            >
              Áp dụng IP
            </Button>
          </Flex>
        </Flex>
      </Form>
    </Modal>
  );
};
