import React from "react";
import { Card, Typography, Flex, Button, Divider, theme } from "antd";
import { CloudOutlined, SafetyCertificateOutlined, ApiOutlined, PartitionOutlined, HddOutlined, WifiOutlined, DesktopOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

const { Title, Text } = Typography;

interface SidebarPaletteProps {
  onAddDevice: (type: string, name: string) => void;
}

export const SidebarPalette: React.FC<SidebarPaletteProps> = ({ onAddDevice }) => {
  const { t } = useTranslation();
  const { token } = theme.useToken();

  const deviceTypes = [
    { name: 'Internet', icon: <CloudOutlined style={{ fontSize: 18, color: token.colorPrimary }} /> },
    { name: 'Firewall', icon: <SafetyCertificateOutlined style={{ fontSize: 18, color: token.colorPrimary }} /> },
    { name: 'Router', icon: <ApiOutlined style={{ fontSize: 18, color: token.colorPrimary }} /> },
    { name: 'Switch', icon: <PartitionOutlined style={{ fontSize: 18, color: token.colorPrimary }} /> },
    { name: 'Server', icon: <HddOutlined style={{ fontSize: 18, color: token.colorPrimary }} /> },
    { name: 'Access Point', icon: <WifiOutlined style={{ fontSize: 18, color: token.colorPrimary }} /> },
    { name: 'PC / IoT', icon: <DesktopOutlined style={{ fontSize: 18, color: token.colorPrimary }} /> }
  ];

  return (
    <Card style={{ height: '100%' }} styles={{ body: { padding: 16 } }}>
      <Title level={5} style={{ marginTop: 0 }}>{t("dashboard.network_monitor.palette.title")}</Title>
      <Text type="secondary" style={{ fontSize: 12 }}>{t("dashboard.network_monitor.palette.subtitle")}</Text>
      
      <Flex vertical gap={8} style={{ marginTop: 24 }}>
         {deviceTypes.map(({name, icon}) => (
           <Button 
              key={name} 
              type="text"
              onClick={() => onAddDevice(name === 'PC / IoT' ? 'device' : name.toLowerCase().replace(' ', ''), name)}
              style={{ padding: '8px 12px', height: 'auto', width: '100%', justifyContent: 'flex-start' }}
           >
             <Flex align="center" gap={12} style={{ width: '100%' }}>
               <Flex justify="center" align="center" style={{ width: 32, height: 32, background: token.colorPrimaryBg, borderRadius: 4 }}>
                 {icon}
               </Flex>
               <Text strong>{name}</Text>
             </Flex>
           </Button>
         ))}
      </Flex>

      <Divider style={{ margin: '16px 0 12px 0' }} />
      <div>
        <Title level={5} style={{ marginTop: 0 }}>{t("dashboard.network_monitor.palette.cable_status")}</Title>
        <Flex vertical gap={8} style={{ marginTop: 8 }}>
          <Flex align="center" gap={8}><div style={{ width: 24, height: 2, background: token.colorSuccess }}></div> <Text type="secondary" style={{ fontSize: 12 }}>UP</Text></Flex>
          <Flex align="center" gap={8}><div style={{ width: 24, height: 2, background: token.colorWarning }}></div> <Text type="secondary" style={{ fontSize: 12 }}>DEGRADED</Text></Flex>
          <Flex align="center" gap={8}><div style={{ width: 24, height: 2, background: token.colorError }}></div> <Text type="secondary" style={{ fontSize: 12 }}>DOWN</Text></Flex>
          <Flex align="center" gap={8}><div style={{ width: 24, height: 2, borderBottom: `2px dashed ${token.colorTextQuaternary}` }}></div> <Text type="secondary" style={{ fontSize: 12 }}>ADMIN DOWN</Text></Flex>
        </Flex>
      </div>
    </Card>
  );
};
