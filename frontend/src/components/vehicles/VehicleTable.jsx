import VehicleStatusBadge from './VehicleStatusBadge.jsx';

export default function VehicleTable({ vehicles, onEdit, onDelete, canManage }) {
  if (vehicles.length === 0) return <div className="empty-state">No vehicles match these filters.</div>;

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Reg. Number</th>
          <th>Name</th>
          <th>Type</th>
          <th>Region</th>
          <th>Max Load</th>
          <th>Odometer</th>
          <th>Status</th>
          {canManage && <th></th>}
        </tr>
      </thead>
      <tbody>
        {vehicles.map((v) => (
          <tr key={v._id}>
            <td className="mono">{v.regNumber}</td>
            <td>{v.name}</td>
            <td>{v.type}</td>
            <td>{v.region}</td>
            <td>{v.maxLoadCapacity} kg</td>
            <td>{v.odometer.toLocaleString()} km</td>
            <td><VehicleStatusBadge status={v.status} /></td>
            {canManage && (
              <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                <button className="btn btn-sm" onClick={() => onEdit(v)}>Edit</button>{' '}
                <button className="btn btn-sm btn-danger" onClick={() => onDelete(v)}>Delete</button>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
