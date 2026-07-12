import { useState } from 'react';
import axiosClient from '../../api/axiosClient.js';

// Surfaces DSA Service #3: Greedy dispatch matching.
export default function DispatchSuggestionPanel({ cargoWeight, plannedStart, plannedEnd, onPick }) {
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function fetchSuggestions() {
    if (!cargoWeight || !plannedStart || !plannedEnd) {
      setError('Fill in cargo weight, planned start, and planned end first.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data } = await axiosClient.post('/trips/suggest', { cargoWeight: Number(cargoWeight), plannedStart, plannedEnd });
      setSuggestions(data.suggestions);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not fetch suggestions');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="panel" style={{ background: 'var(--bg-elevated)' }}>
      <div className="panel-header">
        <div className="panel-title">
          Suggested Assignment
          <span className="algo-tag">greedy matching · O(n log n)</span>
        </div>
        <button type="button" className="btn btn-sm" onClick={fetchSuggestions} disabled={loading}>
          {loading ? 'Thinking…' : 'Suggest'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {suggestions && suggestions.length === 0 && (
        <div className="empty-state">No eligible vehicle/driver pair found for this window. Try adjusting cargo weight or time.</div>
      )}

      {suggestions && suggestions.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${suggestions.length}, 1fr)`, gap: 10 }}>
          {suggestions.map((s) => (
            <div key={s.rank} className="suggestion-card">
              <span className="suggestion-rank">Rank {s.rank}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{s.vehicle.regNumber}</div>
                <div className="text-faint" style={{ fontSize: 12 }}>{s.vehicle.name} · headroom {s.vehicle.capacityHeadroom}kg</div>
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{s.driver.name}</div>
                <div className="text-faint" style={{ fontSize: 12 }}>Safety score {s.driver.safetyScore}</div>
              </div>
              <button type="button" className="btn btn-sm btn-primary" onClick={() => onPick(s)}>
                Use this pair
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
