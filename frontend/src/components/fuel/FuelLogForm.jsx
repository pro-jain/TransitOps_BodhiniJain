import { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient.js';

export default function FuelLogForm({ onSubmit, onCancel, error }) {
  const [vehicles, setVehicles] = useState([]);
  const [form, setForm] = useState({ vehicleId: '', liters: '', cost: '', date: new Date().toISOString().slice(0, 10) });

  useEffect(() => {
    axiosClient.get('/vehicles').then(({ data }) => setVehicles(data));
  }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({ ...form, liters: Number(form.liters), cost: Number(form.cost) });
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="form-grid">
        <div className="form-field">
          <label>Vehicle</label>
          <select value={form.vehicleId} onChange={(e) => update('vehicleId', e.target.value)} required>
            <option value="">Select a vehicle</option>
            {vehicles.map((v) => <option key={v._id} value={v._id}>{v.regNumber} — {v.name}</option>)}
          </select>
        </div>
        <div className="form-field">
          <label>Liters</label>
          <input type="number" min="0" step="0.1" value={form.liters} onChange={(e) => update('liters', e.target.value)} required />
        </div>
        <div className="form-field">
          <label>Cost</label>
          <input type="number" min="0" value={form.cost} onChange={(e) => update('cost', e.target.value)} required />
        </div>
        <div className="form-field">
          <label>Date</label>
          <input type="date" value={form.date} onChange={(e) => update('date', e.target.value)} required />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <button type="submit" className="btn btn-primary">Log Fuel</button>
        <button type="button" className="btn" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
