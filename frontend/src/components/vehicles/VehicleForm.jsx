import { useState } from 'react';

const TYPES = ['Van', 'Truck', 'Pickup', 'Trailer', 'Bus'];
const REGIONS = ['North', 'South', 'East', 'West', 'Unassigned'];

export default function VehicleForm({ initial, onSubmit, onCancel, error }) {
  const [form, setForm] = useState(
    initial || { regNumber: '', name: '', type: 'Van', region: 'North', maxLoadCapacity: '', odometer: '', acquisitionCost: '', status: 'Available' }
  );

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({
      ...form,
      maxLoadCapacity: Number(form.maxLoadCapacity),
      odometer: Number(form.odometer) || 0,
      acquisitionCost: Number(form.acquisitionCost),
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="form-grid">
        <div className="form-field">
          <label>Registration Number</label>
          <input value={form.regNumber} onChange={(e) => update('regNumber', e.target.value)} required />
        </div>
        <div className="form-field">
          <label>Name / Model</label>
          <input value={form.name} onChange={(e) => update('name', e.target.value)} required />
        </div>
        <div className="form-field">
          <label>Type</label>
          <select value={form.type} onChange={(e) => update('type', e.target.value)}>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="form-field">
          <label>Region</label>
          <select value={form.region} onChange={(e) => update('region', e.target.value)}>
            {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div className="form-field">
          <label>Max Load Capacity (kg)</label>
          <input type="number" min="0" value={form.maxLoadCapacity} onChange={(e) => update('maxLoadCapacity', e.target.value)} required />
        </div>
        <div className="form-field">
          <label>Odometer (km)</label>
          <input type="number" min="0" value={form.odometer} onChange={(e) => update('odometer', e.target.value)} />
        </div>
        <div className="form-field">
          <label>Acquisition Cost</label>
          <input type="number" min="0" value={form.acquisitionCost} onChange={(e) => update('acquisitionCost', e.target.value)} required />
        </div>
        <div className="form-field">
          <label>Status</label>
          <select value={form.status} onChange={(e) => update('status', e.target.value)}>
            {['Available', 'On Trip', 'In Shop', 'Retired'].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <button type="submit" className="btn btn-primary">Save Vehicle</button>
        <button type="button" className="btn" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
