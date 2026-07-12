import { useEffect, useState, useCallback } from 'react';
import Topbar from '../components/layout/Topbar.jsx';
import Modal from '../components/common/Modal.jsx';
import VehicleTable from '../components/vehicles/VehicleTable.jsx';
import VehicleForm from '../components/vehicles/VehicleForm.jsx';
import axiosClient from '../api/axiosClient.js';
import { useRole } from '../hooks/useRole.js';

export default function VehiclesPage() {
  const canManage = useRole(['FleetManager']);
  const [vehicles, setVehicles] = useState([]);
  const [filters, setFilters] = useState({ type: '', status: '', region: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formError, setFormError] = useState(null);

  const load = useCallback(() => {
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
    axiosClient.get('/vehicles', { params }).then(({ data }) => setVehicles(data));
  }, [filters]);

  useEffect(load, [load]);

  async function handleSubmit(payload) {
    try {
      setFormError(null);
      if (editing) {
        await axiosClient.put(`/vehicles/${editing._id}`, payload);
      } else {
        await axiosClient.post('/vehicles', payload);
      }
      setModalOpen(false);
      setEditing(null);
      load();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Something went wrong');
    }
  }

  async function handleDelete(vehicle) {
    if (!confirm(`Delete vehicle ${vehicle.regNumber}?`)) return;
    await axiosClient.delete(`/vehicles/${vehicle._id}`);
    load();
  }

  function exportCsv() {
    window.open(`${axiosClient.defaults.baseURL}/vehicles/export/csv`, '_blank');
  }

  return (
    <>
      <Topbar title="Vehicle Registry" subtitle="Master list of all fleet vehicles" />
      <div className="page-body">
        <div className="filter-bar">
          <select value={filters.type} onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}>
            <option value="">All Types</option>
            {['Van', 'Truck', 'Pickup', 'Trailer', 'Bus'].map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
            <option value="">All Statuses</option>
            {['Available', 'On Trip', 'In Shop', 'Retired'].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filters.region} onChange={(e) => setFilters((f) => ({ ...f, region: e.target.value }))}>
            <option value="">All Regions</option>
            {['North', 'South', 'East', 'West', 'Unassigned'].map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
            <button className="btn" onClick={exportCsv}>Export CSV</button>
            {canManage && (
              <button className="btn btn-primary" onClick={() => { setEditing(null); setFormError(null); setModalOpen(true); }}>
                + Add Vehicle
              </button>
            )}
          </div>
        </div>

        <div className="panel">
          <VehicleTable vehicles={vehicles} canManage={canManage} onEdit={(v) => { setEditing(v); setFormError(null); setModalOpen(true); }} onDelete={handleDelete} />
        </div>
      </div>

      {modalOpen && (
        <Modal title={editing ? 'Edit Vehicle' : 'Register Vehicle'} onClose={() => setModalOpen(false)}>
          <VehicleForm initial={editing} onSubmit={handleSubmit} onCancel={() => setModalOpen(false)} error={formError} />
        </Modal>
      )}
    </>
  );
}
