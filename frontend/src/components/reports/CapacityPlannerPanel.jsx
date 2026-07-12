import { useState } from 'react';
import axiosClient from '../../api/axiosClient.js';

export default function CapacityPlannerPanel() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [vehicleCount, setVehicleCount] = useState(5);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleCalculate(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data } = await axiosClient.post('/reports/capacity-planner', { date, vehicleCount: Number(vehicleCount) });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not compute capacity');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">
          Capacity Planner
          <span className="algo-tag">binary search + greedy feasibility · O(n log Σweight)</span>
        </div>
      </div>

      <form onSubmit={handleCalculate} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div className="form-field" style={{ margin: 0 }}>
          <label>Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="form-field" style={{ margin: 0 }}>
          <label>Available Vehicles (K)</label>
          <input type="number" min="1" value={vehicleCount} onChange={(e) => setVehicleCount(e.target.value)} />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Calculating…' : 'Calculate Minimum Capacity'}
        </button>
      </form>

      {error && <div className="alert alert-error" style={{ marginTop: 10 }}>{error}</div>}

      {result && (
        <div className="kpi-card" style={{ marginTop: 14, border: 'none', padding: 0, background: 'transparent' }}>
          <div className="label">Minimum per-vehicle capacity needed with {result.vehicleCount} vehicles</div>
          <div className="value accent">{result.minCapacity} kg</div>
          <div className="text-faint" style={{ marginTop: 6, fontSize: 12.5 }}>
            Across {result.tripCount} trip{result.tripCount === 1 ? '' : 's'} on {result.date}.
          </div>
        </div>
      )}
    </div>
  );
}
