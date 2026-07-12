import { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient.js';
import DispatchSuggestionPanel from './DispatchSuggestionPanel.jsx';

function toLocalInput(date) {
  const d = date ? new Date(date) : new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function TripForm({ onSubmit, onCancel, error }) {
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [form, setForm] = useState({
    source: '',
    destination: '',
    vehicleId: '',
    driverId: '',
    cargoWeight: '',
    plannedDistance: '',
    plannedStart: toLocalInput(new Date()),
    plannedEnd: toLocalInput(new Date(Date.now() + 60 * 60 * 1000)),
    revenue: '',
  });

  useEffect(() => {
    axiosClient.get('/vehicles', { params: { status: 'Available' } }).then(({ data }) => setVehicles(data));
    axiosClient.get('/drivers', { params: { status: 'Available' } }).then(({ data }) => setDrivers(data));
  }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handlePickSuggestion(s) {
    setForm((f) => ({ ...f, vehicleId: s.vehicle._id, driverId: s.driver._id }));
    if (!vehicles.find((v) => v._id === s.vehicle._id)) setVehicles((v) => [...v, s.vehicle]);
    if (!drivers.find((d) => d._id === s.driver._id)) setDrivers((d) => [...d, s.driver]);
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({
      ...form,
      cargoWeight: Number(form.cargoWeight),
      plannedDistance: Number(form.plannedDistance),
      revenue: Number(form.revenue) || 0,
      plannedStart: new Date(form.plannedStart).toISOString(),
      plannedEnd: new Date(form.plannedEnd).toISOString(),
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="alert alert-error">{error}</div>}

      <div className="form-grid">
        <div className="form-field">
          <label>Source</label>
          <input value={form.source} onChange={(e) => update('source', e.target.value)} required />
        </div>
        <div className="form-field">
          <label>Destination</label>
          <input value={form.destination} onChange={(e) => update('destination', e.target.value)} required />
        </div>
        <div className="form-field">
          <label>Cargo Weight (kg)</label>
          <input type="number" min="0" value={form.cargoWeight} onChange={(e) => update('cargoWeight', e.target.value)} required />
        </div>
        <div className="form-field">
          <label>Planned Distance (km)</label>
          <input type="number" min="0" value={form.plannedDistance} onChange={(e) => update('plannedDistance', e.target.value)} required />
        </div>
        <div className="form-field">
          <label>Planned Start</label>
          <input type="datetime-local" value={form.plannedStart} onChange={(e) => update('plannedStart', e.target.value)} required />
        </div>
        <div className="form-field">
          <label>Planned End</label>
          <input type="datetime-local" value={form.plannedEnd} onChange={(e) => update('plannedEnd', e.target.value)} required />
        </div>
        <div className="form-field">
          <label>Revenue (optional)</label>
          <input type="number" min="0" value={form.revenue} onChange={(e) => update('revenue', e.target.value)} placeholder="Auto-estimated if left blank" />
        </div>
      </div>

      <div style={{ margin: '14px 0' }}>
        <DispatchSuggestionPanel
          cargoWeight={form.cargoWeight}
          plannedStart={form.plannedStart ? new Date(form.plannedStart).toISOString() : ''}
          plannedEnd={form.plannedEnd ? new Date(form.plannedEnd).toISOString() : ''}
          onPick={handlePickSuggestion}
        />
      </div>

      <div className="form-grid">
        <div className="form-field">
          <label>Vehicle</label>
          <select value={form.vehicleId} onChange={(e) => update('vehicleId', e.target.value)} required>
            <option value="">Select a vehicle</option>
            {vehicles.map((v) => (
              <option key={v._id} value={v._id}>{v.regNumber} — {v.name} (max {v.maxLoadCapacity}kg)</option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label>Driver</label>
          <select value={form.driverId} onChange={(e) => update('driverId', e.target.value)} required>
            <option value="">Select a driver</option>
            {drivers.map((d) => (
              <option key={d._id} value={d._id}>{d.name} (score {d.safetyScore})</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <button type="submit" className="btn btn-primary">Create Trip (Draft)</button>
        <button type="button" className="btn" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
