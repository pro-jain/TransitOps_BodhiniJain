const CLASS_MAP = { Available: 'available', 'On Trip': 'on-trip', 'Off Duty': 'off-duty', Suspended: 'suspended' };

export default function DriverTable({ drivers, onEdit, onDelete, canManage }) {
  if (drivers.length === 0) return <div className="empty-state">No drivers match these filters.</div>;

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>License #</th>
          <th>Category</th>
          <th>Expiry</th>
          <th>Safety Score</th>
          <th>Status</th>
          {canManage && <th></th>}
        </tr>
      </thead>
      <tbody>
        {drivers.map((d) => {
          const expired = new Date(d.licenseExpiry) < new Date();
          return (
            <tr key={d._id}>
              <td>{d.name}</td>
              <td className="mono">{d.licenseNumber}</td>
              <td>{d.licenseCategory}</td>
              <td className={expired ? 'mono' : 'mono'} style={expired ? { color: 'var(--red)' } : undefined}>
                {new Date(d.licenseExpiry).toLocaleDateString()}{expired ? ' (expired)' : ''}
              </td>
              <td>{d.safetyScore}</td>
              <td><span className={`badge ${CLASS_MAP[d.status] || ''}`}>{d.status}</span></td>
              {canManage && (
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <button className="btn btn-sm" onClick={() => onEdit(d)}>Edit</button>{' '}
                  <button className="btn btn-sm btn-danger" onClick={() => onDelete(d)}>Delete</button>
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
