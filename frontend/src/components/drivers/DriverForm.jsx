import { useState } from 'react';

export default function DriverForm({ initial, onSubmit, onCancel, error }) {
  const [form, setForm] = useState(
    initial
      ? { ...initial, licenseExpiry: new Date(initial.licenseExpiry).toISOString().slice(0, 10) }
      : { name: '', licenseNumber: '', licenseCategory: 'LMV', licenseExpiry: '', contact: '', safetyScore: 80, status: 'Available' }
  );

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({ ...form, safetyScore: Number(form.safetyScore) });
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="form-grid">
        <div className="form-field">
          <label>Full Name</label>
          <input value={form.name} onChange={(e) => update('name', e.target.value)} required />
        </div>
        <div className="form-field">
          <label>License Number</label>
          <input value={form.licenseNumber} onChange={(e) => update('licenseNumber', e.target.value)} required />
        </div>
        <div className="form-field">
          <label>License Category</label>
          <select value={form.licenseCategory} onChange={(e) => update('licenseCategory', e.target.value)}>
            <option value="LMV">LMV</option>
            <option value="HMV">HMV</option>
          </select>
        </div>
        <div className="form-field">
          <label>License Expiry</label>
          <input type="date" value={form.licenseExpiry} onChange={(e) => update('licenseExpiry', e.target.value)} required />
        </div>
        <div className="form-field">
          <label>Contact Number</label>
          <input value={form.contact} onChange={(e) => update('contact', e.target.value)} required />
        </div>
        <div className="form-field">
          <label>Safety Score (0-100)</label>
          <input type="number" min="0" max="100" value={form.safetyScore} onChange={(e) => update('safetyScore', e.target.value)} />
        </div>
        <div className="form-field">
          <label>Status</label>
          <select value={form.status} onChange={(e) => update('status', e.target.value)}>
            {['Available', 'On Trip', 'Off Duty', 'Suspended'].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <button type="submit" className="btn btn-primary">Save Driver</button>
        <button type="button" className="btn" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
