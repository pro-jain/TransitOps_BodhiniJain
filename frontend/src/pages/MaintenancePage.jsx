import { useEffect, useState, useCallback } from 'react';
import Topbar from '../components/layout/Topbar.jsx';
import Modal from '../components/common/Modal.jsx';
import MaintenanceForm from '../components/maintenance/MaintenanceForm.jsx';
import MaintenanceLogTable from '../components/maintenance/MaintenanceLogTable.jsx';
import axiosClient from '../api/axiosClient.js';
import { useRole } from '../hooks/useRole.js';

export default function MaintenancePage() {
  const canManage = useRole(['FleetManager']);
  const [logs, setLogs] = useState([]);
  const [activeFilter, setActiveFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [formError, setFormError] = useState(null);

  const load = useCallback(() => {
    const params = activeFilter ? { isActive: activeFilter } : {};
    axiosClient.get('/maintenance', { params }).then(({ data }) => setLogs(data));
  }, [activeFilter]);

  useEffect(load, [load]);

  async function handleCreate(payload) {
    try {
      setFormError(null);
      await axiosClient.post('/maintenance', payload);
      setModalOpen(false);
      load();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Could not open maintenance record');
    }
  }

  async function handleClose(log) {
    await axiosClient.post(`/maintenance/${log._id}/close`);
    load();
  }

  return (
    <>
      <Topbar title="Maintenance" subtitle="Opening a record pulls the vehicle out of dispatch automatically" />
      <div className="page-body">
        <div className="filter-bar">
          <select value={activeFilter} onChange={(e) => setActiveFilter(e.target.value)}>
            <option value="">All Records</option>
            <option value="true">Open</option>
            <option value="false">Closed</option>
          </select>
          {canManage && (
            <button className="btn btn-primary" style={{ marginLeft: 'auto' }} onClick={() => { setFormError(null); setModalOpen(true); }}>
              + Open Maintenance
            </button>
          )}
        </div>

        <div className="panel">
          <MaintenanceLogTable logs={logs} canManage={canManage} onClose={handleClose} />
        </div>
      </div>

      {modalOpen && (
        <Modal title="Open Maintenance Record" onClose={() => setModalOpen(false)}>
          <MaintenanceForm onSubmit={handleCreate} onCancel={() => setModalOpen(false)} error={formError} />
        </Modal>
      )}
    </>
  );
}
