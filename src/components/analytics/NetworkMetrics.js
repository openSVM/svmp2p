import React from 'react';

export default function NetworkMetrics({ stats, networks, selectedNetwork }) {
  const getHealthColor = (health) => {
    if (health >= 90) return '#10b981'; // Green
    if (health >= 75) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };

  const getHealthLabel = (health) => {
    if (health >= 90) return 'Excellent';
    if (health >= 75) return 'Good';
    if (health >= 50) return 'Fair';
    return 'Poor';
  };

  const formatTPS = (tps) => {
    return tps.toLocaleString() + ' TPS';
  };

  const formatBlockTime = (time) => {
    return time.toFixed(2) + 's';
  };

  const formatValidators = (count) => {
    return count.toLocaleString();
  };

  return (
    <div className="network-metrics">
      <div className="metrics-header">
        <h3 className="metrics-title">Network Performance</h3>
        <div className="metrics-subtitle">
          Real-time metrics across all supported networks
        </div>
      </div>

      <div className="networks-grid">
        {Object.entries(networks).map(([networkKey, network]) => {
          const networkStat = stats[networkKey] || {};
          const isSelected = networkKey === selectedNetwork;
          
          return (
            <div 
              key={networkKey} 
              className={`network-card ${isSelected ? 'selected' : ''}`}
            >
              <div className="network-card-header">
                <div className="network-info">
                  <div 
                    className="network-indicator"
                    style={{ backgroundColor: network.color }}
                  ></div>
                  <div className="network-details">
                    <div className="network-name">{network.name}</div>
                    <div className="network-status">
                      <span 
                        className="health-indicator"
                        style={{ color: getHealthColor(networkStat.networkHealth || 0) }}
                      >
                        ● {getHealthLabel(networkStat.networkHealth || 0)}
                      </span>
                    </div>
                  </div>
                </div>
                
                {isSelected && (
                  <div className="selected-badge">
                    Active
                  </div>
                )}
              </div>

              <div className="network-stats">
                <div className="stat-row">
                  <div className="stat-item">
                    <div className="stat-icon">⚡</div>
                    <div className="stat-content">
                      <div className="stat-value">
                        {formatTPS(networkStat.tps || 0)}
                      </div>
                      <div className="stat-label">Throughput</div>
                    </div>
                  </div>

                  <div className="stat-item">
                    <div className="stat-icon">⏱️</div>
                    <div className="stat-content">
                      <div className="stat-value">
                        {formatBlockTime(networkStat.blockTime || 0)}
                      </div>
                      <div className="stat-label">Block Time</div>
                    </div>
                  </div>
                </div>

                <div className="stat-row">
                  <div className="stat-item">
                    <div className="stat-icon">🏛️</div>
                    <div className="stat-content">
                      <div className="stat-value">
                        {formatValidators(networkStat.activeValidators || 0)}
                      </div>
                      <div className="stat-label">Validators</div>
                    </div>
                  </div>

                  <div className="stat-item">
                    <div className="stat-icon">💚</div>
                    <div className="stat-content">
                      <div className="stat-value">
                        {(networkStat.networkHealth || 0).toFixed(1)}%
                      </div>
                      <div className="stat-label">Health</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="network-actions">
                <a 
                  href={network.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="explorer-link"
                >
                  View Explorer →
                </a>
              </div>
            </div>
          );
        })}
      </div>

      <div className="metrics-summary">
        <div className="summary-header">
          <h4>Cross-Network Summary</h4>
        </div>
        
        <div className="summary-stats">
          <div className="summary-item">
            <div className="summary-icon">🌐</div>
            <div className="summary-content">
              <div className="summary-value">
                {Object.keys(networks).length}
              </div>
              <div className="summary-label">Active Networks</div>
            </div>
          </div>

          <div className="summary-item">
            <div className="summary-icon">📊</div>
            <div className="summary-content">
              <div className="summary-value">
                {Object.values(stats).reduce((sum, stat) => sum + (stat.tps || 0), 0).toLocaleString()}
              </div>
              <div className="summary-label">Total TPS</div>
            </div>
          </div>

          <div className="summary-item">
            <div className="summary-icon">🔗</div>
            <div className="summary-content">
              <div className="summary-value">
                {Object.values(stats).reduce((sum, stat) => sum + (stat.activeValidators || 0), 0).toLocaleString()}
              </div>
              <div className="summary-label">Total Validators</div>
            </div>
          </div>

          <div className="summary-item">
            <div className="summary-icon">💯</div>
            <div className="summary-content">
              <div className="summary-value">
                {Object.values(stats).length > 0 
                  ? (Object.values(stats).reduce((sum, stat) => sum + (stat.networkHealth || 0), 0) / Object.values(stats).length).toFixed(1)
                  : 0
                }%
              </div>
              <div className="summary-label">Avg Health</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}