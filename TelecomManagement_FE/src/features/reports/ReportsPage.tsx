function App() {
  return (
    <>
      <div id="dash-tab" className="content-section active">
        <h3 className="fw-bold mb-4">Hệ thống Giám sát Real-time</h3>
        <div className="row g-4 mb-4">
          <div className="col-md-4">
            <div className="card p-3 stat-card border-primary">
              <small className="text-muted fw-bold">ĐỘ TRỄ TRUNG BÌNH</small>
              <h2 className="fw-bold text-primary mb-0" id="statLat">
                -- ms
              </h2>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card p-3 stat-card border-danger">
              <small className="text-muted fw-bold">MẤT GÓI TRUNG BÌNH</small>
              <h2 className="fw-bold text-danger mb-0" id="statLoss">
                -- %
              </h2>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card p-3 stat-card border-warning">
              <small className="text-muted fw-bold">LỖ HỔNG BẢO MẬT</small>
              <h2 className="fw-bold text-warning mb-0" id="statVuln">
                --
              </h2>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <h6 className="fw-bold mb-4">Lưu lượng Mạng (Traffic Analysis)</h6>
          <div className="chart-h-280">
            <canvas id="trafficChart"></canvas>
          </div>
        </div>
        <div className="row g-4 mt-1">
          <div className="col-lg-6">
            <div className="card p-4">
              <h6 className="fw-bold mb-3 text-info">
                <i className="fas fa-heartbeat me-2"></i>Uptime Realtime
              </h6>
              <div className="chart-h-260">
                <canvas id="dashUptimeChart"></canvas>
              </div>
            </div>
          </div>
          <div className="col-lg-6">
            <div className="card p-4">
              <h6 className="fw-bold mb-3 text-secondary">
                <i className="fas fa-chart-area me-2"></i>Xu hướng sự cố
              </h6>
              <div className="chart-h-260">
                <canvas id="dashErrorTrendChart"></canvas>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
