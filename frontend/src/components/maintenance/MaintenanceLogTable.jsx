export default function MaintenanceLogTable({ logs, onClose, canManage }) {
  if (logs.length === 0) return <div className="empty-state">No maintenance records match these filters.</div>;

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Vehicle</th>
          <th>Type</th>
          <th>Cost</th>
          <th>Opened</th>
          <th>Closed</th>
          <th>Status</th>
          {canManage && <th></th>}
        </tr>
      </thead>
      <tbody>
        {logs.map((log) => (
          <tr key={log._id}>
            <td className="mono">{log.vehicleId?.regNumber || '—'}</td>
            <td>{log.type}</td>
            <td>{log.cost?.toLocaleString()}</td>
            <td>{new Date(log.openedAt).toLocaleDateString()}</td>
            <td>{log.closedAt ? new Date(log.closedAt).toLocaleDateString() : '—'}</td>
            <td><span className={`badge ${log.isActive ? 'in-shop' : 'available'}`}>{log.isActive ? 'Open' : 'Closed'}</span></td>
            {canManage && (
              <td style={{ textAlign: 'right' }}>
                {log.isActive && (
                  <button className="btn btn-sm btn-primary" onClick={() => onClose(log)}>Close</button>
                )}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
