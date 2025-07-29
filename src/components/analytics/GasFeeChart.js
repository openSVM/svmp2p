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

export default function GasFeeChart({ data, network, timeframe }) {
  const chartRef = useRef();

  const chartData = {
    labels: data.map(point => {
      const date = new Date(point.time);
      return timeframe === '1h' 
        ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }),
    datasets: [
      {
        label: 'Gas Fee (SOL)',
        data: data.map(point => point.fee),
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
            return `Gas Fee: ${context.parsed.y.toFixed(6)} SOL`;
          },
          afterLabel: function(context) {
            const usdValue = (context.parsed.y * 150).toFixed(4); // Mock SOL price
            return `≈ $${usdValue} USD`;
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
          text: 'Gas Fee (SOL)',
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
            return value.toFixed(6);
          }
        },
        beginAtZero: false
      }
    },
    elements: {
      point: {
        hoverBackgroundColor: network.color || '#9945FF'
      }
    }
  };

  const currentFee = data.length > 0 ? data[data.length - 1].fee : 0;
  const avgFee = data.length > 0 ? data.reduce((sum, point) => sum + point.fee, 0) / data.length : 0;
  const minFee = data.length > 0 ? Math.min(...data.map(point => point.fee)) : 0;
  const maxFee = data.length > 0 ? Math.max(...data.map(point => point.fee)) : 0;

  return (
    <div className="gas-fee-chart">
      <div className="chart-header">
        <div className="chart-title-section">
          <h3 className="chart-title">Gas Fee Trends</h3>
          <div className="chart-subtitle">
            Network fees over the last {timeframe} on {network.name}
          </div>
        </div>
        
        <div className="fee-stats">
          <div className="stat-item">
            <div className="stat-value">{currentFee.toFixed(6)} SOL</div>
            <div className="stat-label">Current</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{avgFee.toFixed(6)} SOL</div>
            <div className="stat-label">Average</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{minFee.toFixed(6)} SOL</div>
            <div className="stat-label">Min</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{maxFee.toFixed(6)} SOL</div>
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
            <div className="placeholder-icon">📈</div>
            <div className="placeholder-text">Loading gas fee data...</div>
          </div>
        )}
      </div>

      <div className="chart-footer">
        <div className="chart-info">
          <span className="info-item">
            🔄 Updates every 5 seconds
          </span>
          <span className="info-item">
            📊 Based on recent network activity
          </span>
        </div>
      </div>
    </div>
  );
}