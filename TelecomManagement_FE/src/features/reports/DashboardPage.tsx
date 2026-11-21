import { Card, Col, Row, Statistic, Typography } from "antd";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getDashboardSummary } from "../../api/dashboardApi";
import ErrorTrendChart from "../../components/ErrorTrendChart";
import TrafficRealtimeChart from "../../components/TrafficRealtimeChart";
import UptimeRealtimeChart from "../../components/UptimeRealtimeChart ";
import { NetworkMonitor } from "./NetworkMonitor";

export const DashboardPage = () => {
    const { t } = useTranslation();
    const [summary, setSummary] = useState<{
        DeviceCount: number;
        OpenErrorCount: number;
        OpenVulnerabilityCount: number;
    } | null>(null);
    useEffect(() => {
        let active = true;
        void getDashboardSummary()
            .then((result) => {
                if (active) setSummary(result);
            })
            .catch((error: unknown) => console.error(error));
        return () => {
            active = false;
        };
    }, []);
    return (
        <div id="dash-tab" style={{ overflowX: "hidden" }}>
            <Typography.Title
                level={3}
                style={{ marginBottom: 16, marginTop: 16 }}
            >
                {t("dashboard.title")}
            </Typography.Title>
            <div style={{ marginTop: 16 }}>
                <NetworkMonitor />
            </div>
            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                <Col xs={24} md={8}>
                    <Card
                        styles={{
                            body: {
                                borderLeft: "4px solid #1677ff",
                                paddingLeft: 16,
                            },
                        }}
                    >
                        <Statistic
                            title="Thiết bị"
                            value={summary?.DeviceCount ?? "--"}
                            valueStyle={{ color: "#1677ff" }}
                        />
                    </Card>
                </Col>

                <Col xs={24} md={8}>
                    <Card
                        styles={{
                            body: {
                                borderLeft: "4px solid #ff4d4f",
                                paddingLeft: 16,
                            },
                        }}
                    >
                        <Statistic
                            title="Sự cố chưa xử lý"
                            value={summary?.OpenErrorCount ?? "--"}
                            valueStyle={{ color: "#ff4d4f" }}
                        />
                    </Card>
                </Col>

                <Col xs={24} md={8}>
                    <Card
                        styles={{
                            body: {
                                borderLeft: "4px solid #faad14",
                                paddingLeft: 16,
                            },
                        }}
                    >
                        <Statistic
                            title="Lỗ hổng chưa khắc phục"
                            value={summary?.OpenVulnerabilityCount ?? "--"}
                            valueStyle={{ color: "#faad14" }}
                        />
                    </Card>
                </Col>
            </Row>
            <div style={{ marginTop: 16 }}>
                <TrafficRealtimeChart />
            </div>

            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                <Col xs={24} lg={12}>
                    <UptimeRealtimeChart />
                </Col>

                <Col xs={24} lg={12}>
                    <ErrorTrendChart />
                </Col>
            </Row>
        </div>
    );
};
