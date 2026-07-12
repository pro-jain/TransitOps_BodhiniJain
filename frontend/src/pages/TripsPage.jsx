import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../auth/AuthContext.jsx';
import Topbar from '../components/layout/Topbar.jsx';
import Modal from '../components/common/Modal.jsx';
import TripForm from '../components/trips/TripForm.jsx';
import axiosClient from '../api/axiosClient.js';
import { useRole } from '../hooks/useRole.js';

const STATUS_CLASS = {
  Draft: 'draft',
  Dispatched: 'dispatched',
  Completed: 'available',
  Cancelled: 'cancelled',
};

export default function TripsPage() {
  const canManage = useRole(['Driver', 'FleetManager']);
  const [trips, setTrips] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [formError, setFormError] = useState(null);
  const [completingTrip, setCompletingTrip] = useState(null);
  const [completeForm, setCompleteForm] = useState({ actualOdometerEnd: '', fuelConsumed: '', fuelCost: '' });
  const [actionError, setActionError] = useState(null);

  const load = useCallback(() => {
    const params = statusFilter ? { status: statusFilter } : {};
    axiosClient.get('/trips', { params }).then(({ data }) => setTrips(data));
  }, [statusFilter]);

  useEffect(load, [load]);

  async function handleCreate(payload) {
    try {
      setFormError(null);
      await axiosClient.post('/trips', payload);
      setModalOpen(false);
      load();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Could not create trip');
    }
  }

  async function handleDispatch(trip) {
    try {
      setActionError(null);
      const { data } = await axiosClient.post(`/trips/${trip._id}/dispatch`);
      if (data.fleetWarning?.exceedsFleet) {
        setActionError(`Dispatched, but this exceeds available fleet capacity (${data.fleetWarning.projectedInUse} vehicles in use).`);
      }
      load();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Could not dispatch trip');
    }
  }

  async function handleCancel(trip) {
    if (!confirm(`Cancel trip ${trip.source} → ${trip.destination}?`)) return;
    try {
      setActionError(null);
      await axiosClient.post(`/trips/${trip._id}/cancel`);
      load();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Could not cancel trip');
    }
  }

  async function submitCompletion(e) {
    e.preventDefault();
    try {
      setActionError(null);
      await axiosClient.post(`/trips/${completingTrip._id}/complete`, {
        actualOdometerEnd: Number(completeForm.actualOdometerEnd),
        fuelConsumed: Number(completeForm.fuelConsumed),
        fuelCost: Number(completeForm.fuelCost) || 0,
      });
      setCompletingTrip(null);
      setCompleteForm({ actualOdometerEnd: '', fuelConsumed: '', fuelCost: '' });
      load();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Could not complete trip');
    }
  }

  const { user } = useAuth();
  const subtitle = user?.role === 'Driver'
    ? 'Your trips and vehicle assignments'
    : 'Draft → Dispatched → Completed / Cancelled';

  return (
    <>
      <Topbar title="Trip Management" subtitle={subtitle} />
      <div className="page-body">
        <div className="filter-bar">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            {['Draft', 'Dispatched', 'Completed', 'Cancelled'].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          {canManage && (
            <button className="btn btn-primary" style={{ marginLeft: 'auto' }} onClick={() => { setFormError(null); setModalOpen(true); }}>
              + Create Trip
            </button>
          )}
        </div>

        {actionError && <div className="alert alert-error" style={{ marginBottom: 12 }}>{actionError}</div>}

        <div className="panel">
          {trips.length === 0 && <div className="empty-state">No trips match these filters.</div>}
          {trips.length > 0 && (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Route</th>
                  <th>Vehicle</th>
                  <th>Driver</th>
                  <th>Cargo</th>
                  <th>Planned Start</th>
                  <th>Status</th>
                  {canManage && <th></th>}
                </tr>
              </thead>
              <tbody>
                {trips.map((t) => (
                  <tr key={t._id}>
                    <td>{t.source} → {t.destination}</td>
                    <td className="mono">{t.vehicleId?.regNumber || '—'}</td>
                    <td>{t.driverId?.name || '—'}</td>
                    <td>{t.cargoWeight} kg</td>
                    <td>{new Date(t.plannedStart).toLocaleString()}</td>
                    <td><span className={`badge ${STATUS_CLASS[t.status] || ''}`}>{t.status}</span></td>
                    {canManage && (
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {t.status === 'Draft' && (
                          <>
                            <button className="btn btn-sm btn-primary" onClick={() => handleDispatch(t)}>Dispatch</button>{' '}
                            <button className="btn btn-sm btn-danger" onClick={() => handleCancel(t)}>Cancel</button>
                          </>
                        )}
                        {t.status === 'Dispatched' && (
                          <>
                            <button className="btn btn-sm btn-primary" onClick={() => { setCompletingTrip(t); setActionError(null); }}>Complete</button>{' '}
                            <button className="btn btn-sm btn-danger" onClick={() => handleCancel(t)}>Cancel</button>
                          </>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modalOpen && (
        <Modal title="Create Trip" onClose={() => setModalOpen(false)}>
          <TripForm onSubmit={handleCreate} onCancel={() => setModalOpen(false)} error={formError} />
        </Modal>
      )}

      {completingTrip && (
        <Modal title={`Complete Trip: ${completingTrip.source} → ${completingTrip.destination}`} onClose={() => setCompletingTrip(null)}>
          <form onSubmit={submitCompletion}>
            <div className="form-grid">
              <div className="form-field">
                <label>Final Odometer (km)</label>
                <input type="number" min="0" required value={completeForm.actualOdometerEnd}
                  onChange={(e) => setCompleteForm((f) => ({ ...f, actualOdometerEnd: e.target.value }))} />
              </div>
              <div className="form-field">
                <label>Fuel Consumed (liters)</label>
                <input type="number" min="0" required value={completeForm.fuelConsumed}
                  onChange={(e) => setCompleteForm((f) => ({ ...f, fuelConsumed: e.target.value }))} />
              </div>
              <div className="form-field">
                <label>Fuel Cost</label>
                <input type="number" min="0" value={completeForm.fuelCost}
                  onChange={(e) => setCompleteForm((f) => ({ ...f, fuelCost: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button type="submit" className="btn btn-primary">Mark Completed</button>
              <button type="button" className="btn" onClick={() => setCompletingTrip(null)}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
