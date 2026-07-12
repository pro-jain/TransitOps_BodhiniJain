import { useEffect, useState, useCallback } from 'react';
import Topbar from '../components/layout/Topbar.jsx';
import Modal from '../components/common/Modal.jsx';
import FuelLogForm from '../components/fuel/FuelLogForm.jsx';
import ExpenseForm from '../components/fuel/ExpenseForm.jsx';
import axiosClient from '../api/axiosClient.js';
import { useRole } from '../hooks/useRole.js';

export default function FuelExpensePage() {
  const canManage = useRole(['FleetManager', 'FinancialAnalyst', 'Driver']);
  const [tab, setTab] = useState('fuel');
  const [fuelLogs, setFuelLogs] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [formError, setFormError] = useState(null);

  const load = useCallback(() => {
    axiosClient.get('/fuel').then(({ data }) => setFuelLogs(data));
    axiosClient.get('/expenses').then(({ data }) => setExpenses(data));
  }, []);

  useEffect(load, [load]);

  async function handleFuelSubmit(payload) {
    try {
      setFormError(null);
      await axiosClient.post('/fuel', payload);
      setModalOpen(false);
      load();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Could not log fuel');
    }
  }

  async function handleExpenseSubmit(payload) {
    try {
      setFormError(null);
      await axiosClient.post('/expenses', payload);
      setModalOpen(false);
      load();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Could not log expense');
    }
  }

  return (
    <>
      <Topbar title="Fuel & Expenses" subtitle="Per-vehicle fuel logs and other operational expenses" />
      <div className="page-body">
        <div className="filter-bar">
          <button className={`btn btn-sm${tab === 'fuel' ? ' btn-primary' : ''}`} onClick={() => setTab('fuel')}>Fuel Logs</button>
          <button className={`btn btn-sm${tab === 'expenses' ? ' btn-primary' : ''}`} onClick={() => setTab('expenses')}>Expenses</button>
          {canManage && (
            <button className="btn btn-primary" style={{ marginLeft: 'auto' }} onClick={() => { setFormError(null); setModalOpen(true); }}>
              + {tab === 'fuel' ? 'Log Fuel' : 'Log Expense'}
            </button>
          )}
        </div>

        <div className="panel">
          {tab === 'fuel' && (
            fuelLogs.length === 0 ? <div className="empty-state">No fuel logs yet.</div> : (
              <table className="data-table">
                <thead><tr><th>Vehicle</th><th>Liters</th><th>Cost</th><th>Date</th></tr></thead>
                <tbody>
                  {fuelLogs.map((f) => (
                    <tr key={f._id}>
                      <td className="mono">{f.vehicleId?.regNumber || '—'}</td>
                      <td>{f.liters} L</td>
                      <td>{f.cost}</td>
                      <td>{new Date(f.date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}

          {tab === 'expenses' && (
            expenses.length === 0 ? <div className="empty-state">No expenses logged yet.</div> : (
              <table className="data-table">
                <thead><tr><th>Vehicle</th><th>Category</th><th>Amount</th><th>Date</th><th>Note</th></tr></thead>
                <tbody>
                  {expenses.map((e) => (
                    <tr key={e._id}>
                      <td className="mono">{e.vehicleId?.regNumber || '—'}</td>
                      <td>{e.category}</td>
                      <td>{e.amount}</td>
                      <td>{new Date(e.date).toLocaleDateString()}</td>
                      <td>{e.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>
      </div>

      {modalOpen && tab === 'fuel' && (
        <Modal title="Log Fuel" onClose={() => setModalOpen(false)}>
          <FuelLogForm onSubmit={handleFuelSubmit} onCancel={() => setModalOpen(false)} error={formError} />
        </Modal>
      )}
      {modalOpen && tab === 'expenses' && (
        <Modal title="Log Expense" onClose={() => setModalOpen(false)}>
          <ExpenseForm onSubmit={handleExpenseSubmit} onCancel={() => setModalOpen(false)} error={formError} />
        </Modal>
      )}
    </>
  );
}
