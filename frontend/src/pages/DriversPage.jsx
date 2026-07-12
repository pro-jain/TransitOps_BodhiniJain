import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../auth/AuthContext.jsx';
import Topbar from '../components/layout/Topbar.jsx';
import Modal from '../components/common/Modal.jsx';
import DriverTable from '../components/drivers/DriverTable.jsx';
import DriverForm from '../components/drivers/DriverForm.jsx';
import axiosClient from '../api/axiosClient.js';
import { useRole } from '../hooks/useRole.js';

export default function DriversPage() {
  const canManage = useRole(['FleetManager', 'SafetyOfficer']);
  const [drivers, setDrivers] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formError, setFormError] = useState(null);

  const load = useCallback(() => {
    const params = statusFilter ? { status: statusFilter } : {};
    axiosClient.get('/drivers', { params }).then(({ data }) => setDrivers(data));
  }, [statusFilter]);

  useEffect(load, [load]);

  async function handleSubmit(payload) {
    try {
      setFormError(null);
      if (editing) {
        await axiosClient.put(`/drivers/${editing._id}`, payload);
      } else {
        await axiosClient.post('/drivers', payload);
      }
      setModalOpen(false);
      setEditing(null);
      load();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Something went wrong');
    }
  }

  async function handleDelete(driver) {
    if (!confirm(`Delete driver ${driver.name}?`)) return;
    await axiosClient.delete(`/drivers/${driver._id}`);
    load();
  }

  function exportCsv() {
    window.open(`${axiosClient.defaults.baseURL}/drivers/export/csv`, '_blank');
  }

  const { user } = useAuth();
  const subtitle = user?.role === 'Driver' ? 'Your driver profile' : 'Profiles, licenses, and safety scores';

  return (
    <>
      <Topbar title="Driver Management" subtitle={subtitle} />
      <div className="page-body">
        <div className="filter-bar">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            {['Available', 'On Trip', 'Off Duty', 'Suspended'].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
            <button className="btn" onClick={exportCsv}>Export CSV</button>
            {canManage && (
              <button className="btn btn-primary" onClick={() => { setEditing(null); setFormError(null); setModalOpen(true); }}>
                + Add Driver
              </button>
            )}
          </div>
        </div>

        <div className="panel">
          <DriverTable drivers={drivers} canManage={canManage} onEdit={(d) => { setEditing(d); setFormError(null); setModalOpen(true); }} onDelete={handleDelete} />
        </div>
      </div>

      {modalOpen && (
        <Modal title={editing ? 'Edit Driver' : 'Register Driver'} onClose={() => setModalOpen(false)}>
          <DriverForm initial={editing} onSubmit={handleSubmit} onCancel={() => setModalOpen(false)} error={formError} />
        </Modal>
      )}
    </>
  );
}
