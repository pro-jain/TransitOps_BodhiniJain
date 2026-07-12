import { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient.js';

function daysUntil(dateStr) {
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function dateTone(days) {
  if (days < 0) return 'urgent';
  if (days <= 14) return 'soon';
  return '';
}

// Surfaces DSA Service #4: Min-heaps by date (license expiry / maintenance due).
export default function ComplianceWidget() {
  const [data, setData] = useState(null);

  useEffect(() => {
    axiosClient.get('/dashboard/compliance', { params: { n: 5 } }).then(({ data }) => setData(data));
  }, []);

  return (
    <div className="panel-grid-2">
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">
            Upcoming License Expirations
            <span className="algo-tag">min-heap · O(log n)</span>
          </div>
        </div>
        {!data && <div className="text-faint">Loading…</div>}
        {data && data.upcomingLicenseExpirations.length === 0 && (
          <div className="empty-state">No drivers to show.</div>
        )}
        {data?.upcomingLicenseExpirations.map((item, i) => {
          const days = daysUntil(item.expiryDate);
          return (
            <div className="heap-item" key={item.driverId}>
              <span className="heap-rank">{i + 1}</span>
              <div className="heap-item-main">
                <div className="heap-item-name">{item.name}</div>
                <div className="heap-item-sub">{item.licenseNumber}</div>
              </div>
              <div className={`heap-item-date ${dateTone(days)}`}>
                {days < 0 ? `Expired ${Math.abs(days)}d ago` : `${days}d left`}
              </div>
            </div>
          );
        })}
      </div>

      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">
            Upcoming Maintenance
            <span className="algo-tag">min-heap · O(log n)</span>
          </div>
        </div>
        {!data && <div className="text-faint">Loading…</div>}
        {data && data.upcomingMaintenance.length === 0 && (
          <div className="empty-state">No vehicles to show.</div>
        )}
        {data?.upcomingMaintenance.map((item, i) => {
          const days = daysUntil(item.dueDate);
          return (
            <div className="heap-item" key={item.vehicleId}>
              <span className="heap-rank">{i + 1}</span>
              <div className="heap-item-main">
                <div className="heap-item-name">{item.regNumber}</div>
                <div className="heap-item-sub">{item.reason}</div>
              </div>
              <div className={`heap-item-date ${dateTone(days)}`}>
                {days <= 0 ? 'Due now' : `${days}d left`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
