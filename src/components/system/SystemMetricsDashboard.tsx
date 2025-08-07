import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Spin, Statistic, Progress, Tabs, List, Tag, Alert } from 'antd';
import { systemService, SystemStatus, SystemMetrics } from '../../services/systemService';

const { TabPane } = Tabs;

const SystemMetricsDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [status, setStatus] = useState<SystemStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    // Subscribe to real-time updates
    const metricsSubscription = systemService.getRealtimeMetrics().subscribe({
      next: (data) => {
        if (data && isMounted) {
          setMetrics(data);
          setLoading(false);
        }
      },
      error: (err) => {
        console.error('Error in metrics subscription:', err);
        if (isMounted) {
          setError('Failed to load real-time metrics');
          setLoading(false);
        }
      },
    });

    const statusSubscription = systemService.getRealtimeStatus().subscribe({
      next: (data) => {
        if (isMounted) {
          setStatus(data);
        }
      },
      error: (err) => {
        console.error('Error in status subscription:', err);
        if (isMounted) {
          setError('Failed to load system status');
        }
      },
    });

    // Initial data load
    const loadInitialData = async () => {
      try {
        if (isMounted) {
          setLoading(true);
        }
        
        const [initialStatus, initialMetrics] = await Promise.all([
          systemService.getSystemStatus(),
          systemService.getSystemMetrics(),
        ]);
        
        if (isMounted) {
          setStatus(initialStatus);
          // getSystemMetrics returns a single metrics object or null
          if (initialMetrics) {
            setMetrics(initialMetrics);
          }
        }
      } catch (err) {
        console.error('Error loading initial data:', err);
        if (isMounted) {
          setError('Failed to load initial system data');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadInitialData();

    // Cleanup function
    return () => {
      isMounted = false;
      metricsSubscription.unsubscribe();
      statusSubscription.unsubscribe();
    };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'UP':
        return 'success';
      case 'DEGRADED':
        return 'warning'; // This is valid for Tag component
      case 'DOWN':
        return 'error'; // This is valid for Tag component
      default:
        return 'default';
    }
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Spin size="large" tip="Loading system metrics..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          className="mb-4"
        />
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="p-4">
        <Alert
          message="No Metrics Available"
          description="Could not load system metrics. Please try again later."
          type="warning"
          showIcon
        />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Error"
        description={error}
        type="error"
        showIcon
        style={{ margin: '1rem' }}
      />
    );
  }

  return (
    <div className="system-metrics-dashboard">
      <Tabs defaultActiveKey="overview">
        <TabPane tab="Overview" key="overview">
          <Row gutter={[16, 16]} style={{ marginBottom: '1rem' }}>
            <Col xs={24} md={8}>
              <Card title="CPU Usage" style={{ height: '100%' }}>
                {metrics && (
                  <>
                    <Progress
                      type="dashboard"
                      percent={Math.round(metrics.cpu.usage * 100) / 100}
                      format={(percent) => `${percent}%`}
                      status={metrics.cpu.usage > 90 ? 'exception' : 'success'}
                    />
                    <div style={{ marginTop: '1rem' }}>
                      <Statistic
                        title="Cores"
                        value={metrics.cpu.cores}
                        precision={0}
                      />
                      <Statistic
                        title="Load Average"
                        value={metrics.cpu.load[0].toFixed(2)}
                        suffix={`/ ${metrics.cpu.cores}`}
                      />
                    </div>
                  </>
                )}
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card title="Memory Usage" style={{ height: '100%' }}>
                {metrics && (
                  <>
                    <Progress
                      type="dashboard"
                      percent={Math.round((metrics.memory.used / metrics.memory.total) * 100 * 100) / 100}
                      format={(percent) => `${percent}%`}
                      status={metrics.memory.used / metrics.memory.total > 0.9 ? 'exception' : 'success'}
                    />
                    <div style={{ marginTop: '1rem' }}>
                      <Statistic
                        title="Used / Total"
                        value={formatBytes(metrics.memory.used)}
                        suffix={`/ ${formatBytes(metrics.memory.total)}`}
                      />
                      <Statistic
                        title="Free"
                        value={formatBytes(metrics.memory.free)}
                      />
                    </div>
                  </>
                )}
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card title="Disk Usage" style={{ height: '100%' }}>
                {metrics && (
                  <>
                    <Progress
                      type="dashboard"
                      percent={Math.round((metrics.disk.used / metrics.disk.total) * 100 * 100) / 100}
                      format={(percent) => `${percent}%`}
                      status={metrics.disk.used / metrics.disk.total > 0.9 ? 'exception' : 'success'}
                    />
                    <div style={{ marginTop: '1rem' }}>
                      <Statistic
                        title="Used / Total"
                        value={formatBytes(metrics.disk.used)}
                        suffix={`/ ${formatBytes(metrics.disk.total)}`}
                      />
                      <Statistic
                        title="Free"
                        value={formatBytes(metrics.disk.free)}
                      />
                    </div>
                  </>
                )}
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginBottom: '1rem' }}>
            <Col span={24}>
              <Card title="Network Traffic">
                {metrics && (
                  <Row gutter={16}>
                    <Col xs={24} md={12}>
                      <Statistic
                        title="Bytes In"
                        value={formatBytes(metrics.network.bytesIn)}
                      />
                    </Col>
                    <Col xs={24} md={12}>
                      <Statistic
                        title="Bytes Out"
                        value={formatBytes(metrics.network.bytesOut)}
                      />
                    </Col>
                  </Row>
                )}
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="System Status" key="status">
          <List
            itemLayout="horizontal"
            dataSource={status}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  title={
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ marginRight: '8px' }}>{item.componentName}</span>
                      <Tag color={getStatusColor(item.status)}>
                        {item.status}
                      </Tag>
                    </div>
                  }
                  description={
                    <>
                      <div>{item.description}</div>
                      <div style={{ fontSize: '0.8em', color: '#888' }}>
                        Version: {item.version} | Last checked:{' '}
                        {new Date(item.lastChecked).toLocaleString()}
                      </div>
                    </>
                  }
                />
              </List.Item>
            )}
          />
        </TabPane>
      </Tabs>
    </div>
  );
};

export default SystemMetricsDashboard;
