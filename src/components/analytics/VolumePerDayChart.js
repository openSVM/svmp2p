import React, { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function VolumePerDayChart({ data, network, timeframe }) {
  const chartRef = useRef();

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

  const chartData = {
    labels: data.map(point => formatDate(point.time)),
    datasets: [
      {
        label: 'Protocol Volume (SOL)',
        data: data.map(point => point.volume),
        borderColor: network.color || '#9945FF',
        backgroundColor: `${network.color || '#9945FF'}20`,
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 6,
        pointBackgroundColor: network.color || '#9945FF',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: '#1f2937',
          font: {
            size: 12,
            family: 'Inter, system-ui, sans-serif'
          }
        }
      },
      title: {
        display: false
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: network.color || '#9945FF',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: function(context) {
            const volume = context.parsed.y;
            if (volume >= 1000000) {
              return `Volume: ${(volume / 1000000).toFixed(2)}M SOL`;
            } else if (volume >= 1000) {
              return `Volume: ${(volume / 1000).toFixed(2)}K SOL`;
            }
            return `Volume: ${volume.toFixed(2)} SOL`;
          },
          afterLabel: function(context) {
            const usdValue = (context.parsed.y * 150).toFixed(0); // Mock SOL price
            return `≈ $${Number(usdValue).toLocaleString()} USD`;
          }
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Time',
          color: '#6b7280',
          font: {
            size: 12,
            family: 'Inter, system-ui, sans-serif'
          }
        },
        grid: {
          color: 'rgba(107, 114, 128, 0.1)',
          borderColor: 'rgba(107, 114, 128, 0.2)'
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 11
          },
          maxTicksLimit: 8
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Volume (SOL)',
          color: '#6b7280',
          font: {
            size: 12,
            family: 'Inter, system-ui, sans-serif'
          }
        },
        grid: {
          color: 'rgba(107, 114, 128, 0.1)',
          borderColor: 'rgba(107, 114, 128, 0.2)'
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 11
          },
          callback: function(value) {
            if (value >= 1000000) {
              return `${(value / 1000000).toFixed(1)}M`;
            } else if (value >= 1000) {
              return `${(value / 1000).toFixed(1)}K`;
            }
            return value.toFixed(0);
          }
        },
        beginAtZero: true
      }
    },
    elements: {
      point: {
        hoverBackgroundColor: network.color || '#9945FF'
      }
    }
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

      <div className="chart-container">
        {data.length > 0 ? (
          <Line 
            ref={chartRef}
            data={chartData} 
            options={chartOptions} 
          />
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