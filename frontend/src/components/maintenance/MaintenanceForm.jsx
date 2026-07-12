import { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient.js';

const TYPES = ['Oil Change', 'Tire Rotation', 'Brake Service', 'Engine Overhaul', 'Inspection', 'Other'];

export default function MaintenanceForm({ onSubmit, onCancel, error }) {
  const [vehicles, setVehicles] = useState([]);
  const [form, setForm] = useState({ vehicleId: '', type: 'Oil Change', cost: '' });

  useEffect(() => {
    axiosClient.get('/vehicles').then(({ data }) =>
      setVehicles(data.filter((v) => v.status !== 'In Shop' && v.status !== 'Retired'))
    );
  }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({ ...form, cost: Number(form.cost) || 0 });
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="form-grid">
        <div className="form-field">
          <label>Vehicle</label>
          <select value={form.vehicleId} onChange={(e) => update('vehicleId', e.target.value)} required>
            <option value="">Select a vehicle</option>
            {vehicles.map((v) => (
              <option key={v._id} value={v._id}>{v.regNumber} — {v.name}</option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label>Maintenance Type</label>
          <select value={form.type} onChange={(e) => update('type', e.target.value)}>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="form-field">
          <label>Estimated Cost</label>
          <input type="number" min="0" value={form.cost} onChange={(e) => update('cost', e.target.value)} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <button type="submit" className="btn btn-primary">Open Maintenance</button>
        <button type="button" className="btn" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
