import { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient.js';

const CATEGORIES = ['Toll', 'Fine', 'Parking', 'Insurance', 'Permit', 'Other'];

export default function ExpenseForm({ onSubmit, onCancel, error }) {
  const [vehicles, setVehicles] = useState([]);
  const [form, setForm] = useState({ vehicleId: '', category: 'Toll', amount: '', date: new Date().toISOString().slice(0, 10), note: '' });

  useEffect(() => {
    axiosClient.get('/vehicles').then(({ data }) => setVehicles(data));
  }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({ ...form, amount: Number(form.amount) });
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
          <label>Category</label>
          <select value={form.category} onChange={(e) => update('category', e.target.value)}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-field">
          <label>Amount</label>
          <input type="number" min="0" value={form.amount} onChange={(e) => update('amount', e.target.value)} required />
        </div>
        <div className="form-field">
          <label>Date</label>
          <input type="date" value={form.date} onChange={(e) => update('date', e.target.value)} required />
        </div>
        <div className="form-field">
          <label>Note</label>
          <input value={form.note} onChange={(e) => update('note', e.target.value)} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <button type="submit" className="btn btn-primary">Log Expense</button>
        <button type="button" className="btn" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
