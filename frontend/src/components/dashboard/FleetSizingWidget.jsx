import { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient.js';

// Surfaces DSA Service #1: Interval Partitioning.
export default function FleetSizingWidget() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    axiosClient
      .get('/dashboard/fleet-sizing', { params: { date } })
      .then(({ data }) => !cancelled && setData(data))
      .catch(() => !cancelled && setData(null))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [date]);

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">
          Fleet Sizing
          <span className="algo-tag">interval partitioning · O(n log n)</span>
        </div>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      {loading && <div className="text-faint">Calculating…</div>}
      {!loading && data && (
        <>
          <div className="kpi-card" style={{ border: 'none', padding: 0, background: 'transparent' }}>
            <div className="label">Minimum vehicles needed today</div>
            <div className="value accent">{data.minimumVehiclesNeeded}</div>
          </div>
          <div className="text-faint" style={{ marginTop: 10, fontSize: 12.5 }}>
            Across {data.tripCount} trip{data.tripCount === 1 ? '' : 's'}, peak concurrent usage was{' '}
            {data.peakConcurrentVehicles} vehicle{data.peakConcurrentVehicles === 1 ? '' : 's'}.
          </div>
        </>
      )}
    </div>
  );
}
