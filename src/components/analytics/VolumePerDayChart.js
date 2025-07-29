import React, { useState } from 'react';

export default function VolumePerDayChart({ data, network, timeframe }) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    if (timeframe === '1h') {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (timeframe === '24h') {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (timeframe === '7d') {
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  // ASCII Chart Generation Functions
  const generateAsciiChart = (data, chartWidth = 80, height = 12) => {
    if (!data || data.length === 0) return [];
    
    const volumes = data.map(point => point.volume);
    const maxVolume = Math.max(...volumes);
    const minVolume = Math.min(...volumes);
    const range = maxVolume - minVolume || 1;
    
    // Calculate bar width and spacing - wider bars with better spacing
    const barWidth = 3; // Each bar is 3 characters wide
    const barSpacing = 1; // 1 character spacing between bars
    const totalBarsNeeded = Math.min(data.length, Math.floor(chartWidth / (barWidth + barSpacing)));
    const actualChartWidth = totalBarsNeeded * (barWidth + barSpacing);
    
    // Create chart grid
    const chart = Array(height).fill().map(() => Array(actualChartWidth).fill(' '));
    
    // Plot vertical bars for each data point
    for (let i = 0; i < totalBarsNeeded; i++) {
      const dataIndex = Math.floor((i / totalBarsNeeded) * data.length);
      const volume = volumes[dataIndex];
      const normalizedHeight = Math.round(((volume - minVolume) / range) * (height - 1));
      const barHeight = normalizedHeight + 1; // +1 to ensure at least 1 character for non-zero values
      
      // Calculate bar start position
      const barStartX = i * (barWidth + barSpacing);
      
      // Draw vertical bar from bottom up - 3 characters wide
      for (let barY = 0; barY < barHeight && barY < height; barY++) {
        const y = height - 1 - barY;
        if (y >= 0 && y < height) {
          // Fill all 3 characters of the bar width
          for (let barX = 0; barX < barWidth; barX++) {
            const x = barStartX + barX;
            if (x < actualChartWidth) {
              chart[y][x] = '█';
            }
          }
        }
      }
    }
    
    return { chart, actualWidth: actualChartWidth, totalBarsNeeded };
  };

  const generateYAxisLabels = (data, height = 12) => {
    if (!data || data.length === 0) return [];
    
    const volumes = data.map(point => point.volume);
    const maxVolume = Math.max(...volumes);
    const minVolume = Math.min(...volumes);
    
    const labels = [];
    for (let i = 0; i < height; i++) {
      const value = minVolume + ((maxVolume - minVolume) / (height - 1)) * (height - 1 - i);
      let formattedValue;
      if (value >= 1000000) {
        formattedValue = `${(value / 1000000).toFixed(1)}M`;
      } else if (value >= 1000) {
        formattedValue = `${(value / 1000).toFixed(1)}K`;
      } else {
        formattedValue = value.toFixed(0);
      }
      labels.push(formattedValue.padStart(6));
    }
    return labels;
  };

  const generateXAxisLabels = (data, chartInfo) => {
    if (!data || data.length === 0 || !chartInfo) return [];
    
    const { actualWidth, totalBarsNeeded } = chartInfo;
    const labels = [];
    const barWidth = 3;
    const barSpacing = 1;
    
    // Show fewer labels to prevent overlap - maximum 6 labels
    const maxLabels = 6;
    const step = Math.max(1, Math.floor(totalBarsNeeded / maxLabels));
    
    for (let i = 0; i < totalBarsNeeded; i += step) {
      const dataIndex = Math.floor((i / totalBarsNeeded) * data.length);
      if (dataIndex < data.length) {
        const formatted = formatDate(data[dataIndex].time);
        // Position at center of bar
        const barCenterX = i * (barWidth + barSpacing) + Math.floor(barWidth / 2);
        const positionPercent = (barCenterX / actualWidth) * 100;
        labels.push({ position: positionPercent, label: formatted });
      }
    }
    
    // Always include the last data point if not already included
    const lastIndex = totalBarsNeeded - 1;
    const lastDataIndex = data.length - 1;
    if (lastIndex >= 0 && !labels.some(l => l.label === formatDate(data[lastDataIndex].time))) {
      const lastBarCenterX = lastIndex * (barWidth + barSpacing) + Math.floor(barWidth / 2);
      const lastPositionPercent = (lastBarCenterX / actualWidth) * 100;
      labels.push({ position: lastPositionPercent, label: formatDate(data[lastDataIndex].time) });
    }
    
    return labels;
  };

  const formatVolume = (volume) => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(2)}M SOL`;
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(2)}K SOL`;
    }
    return `${volume.toFixed(2)} SOL`;
  };

  const currentVolume = data.length > 0 ? data[data.length - 1].volume : 0;
  const avgVolume = data.length > 0 ? data.reduce((sum, point) => sum + point.volume, 0) / data.length : 0;
  const minVolume = data.length > 0 ? Math.min(...data.map(point => point.volume)) : 0;
  const maxVolume = data.length > 0 ? Math.max(...data.map(point => point.volume)) : 0;

  // Generate ASCII chart data
  const chartHeight = 12;
  const chartResult = generateAsciiChart(data, 80, chartHeight);
  const asciiChart = chartResult?.chart || [];
  const chartWidth = chartResult?.actualWidth || 60;
  const yAxisLabels = generateYAxisLabels(data, chartHeight);
  const xAxisLabels = generateXAxisLabels(data, chartResult);

  return (
    <div className="volume-chart">
      <div className="chart-header">
        <div className="chart-title-section">
          <h3 className="chart-title">Protocol Volume Trends</h3>
          <div className="chart-subtitle">
            Trading volume over the last {timeframe} on {network.name}
          </div>
        </div>
        
        <div className="volume-stats">
          <div className="stat-item">
            <div className="stat-value">{formatVolume(currentVolume)}</div>
            <div className="stat-label">Latest</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{formatVolume(avgVolume)}</div>
            <div className="stat-label">Average</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{formatVolume(minVolume)}</div>
            <div className="stat-label">Min</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{formatVolume(maxVolume)}</div>
            <div className="stat-label">Max</div>
          </div>
        </div>
      </div>

      <div className="ascii-chart-container">
        {data.length > 0 ? (
          <div className="ascii-chart">
            <div className="chart-legend">
              <span className="legend-item">[█] Protocol Volume (SOL)</span>
            </div>
            
            <div className="ascii-chart-grid">
              {asciiChart.map((row, rowIndex) => (
                <div key={rowIndex} className="chart-row">
                  <span className="y-axis-label">
                    {yAxisLabels[rowIndex]}
                  </span>
                  <span className="y-axis-separator">|</span>
                  <span className="chart-line">
                    {row.map((char, colIndex) => (
                      <span 
                        key={colIndex}
                        className={`chart-char ${char !== ' ' ? 'chart-point' : ''}`}
                        onMouseEnter={() => {
                          if (char !== ' ' && chartResult) {
                            // Calculate which data point this character represents
                            const barWidth = 3;
                            const barSpacing = 1;
                            const barIndex = Math.floor(colIndex / (barWidth + barSpacing));
                            const dataIndex = Math.floor((barIndex / chartResult.totalBarsNeeded) * data.length);
                            if (dataIndex < data.length) {
                              setHoveredPoint({
                                index: dataIndex,
                                volume: data[dataIndex].volume,
                                time: data[dataIndex].time
                              });
                            }
                          }
                        }}
                        onMouseLeave={() => setHoveredPoint(null)}
                      >
                        {char}
                      </span>
                    ))}
                  </span>
                </div>
              ))}
              
              {/* X-axis */}
              <div className="chart-row x-axis-row">
                <span className="y-axis-label">      </span>
                <span className="y-axis-separator">|</span>
                <span className="chart-line">
                  {'_'.repeat(chartWidth)}
                </span>
              </div>
              
              {/* X-axis labels */}
              <div className="x-axis-labels">
                <span className="y-axis-label">      </span>
                <span className="y-axis-separator"> </span>
                <div className="x-labels-container">
                  {xAxisLabels.map((labelData, index) => (
                    <span 
                      key={index}
                      className="x-axis-label"
                      style={{ left: `${labelData.position}%` }}
                    >
                      {labelData.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {hoveredPoint && (
              <div className="ascii-tooltip">
                <div className="tooltip-header">
                  [VOLUME DATA]
                </div>
                <div className="tooltip-content">
                  <div>Time: {formatDate(hoveredPoint.time)}</div>
                  <div>Volume: {formatVolume(hoveredPoint.volume)}</div>
                  <div>≈ ${(hoveredPoint.volume * 150).toLocaleString()} USD</div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="chart-placeholder">
            <div className="placeholder-icon">[CHART]</div>
            <div className="placeholder-text">Loading volume data...</div>
          </div>
        )}
      </div>

      <div className="chart-footer">
        <div className="chart-info">
          <span className="info-item">
            [UPDATE] Updates every 5 minutes
          </span>
          <span className="info-item">
            [DATA] Protocol trading volume only
          </span>
        </div>
      </div>
    </div>
  );
}