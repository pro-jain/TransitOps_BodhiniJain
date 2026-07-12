const CLASS_MAP = {
  'Available': 'available',
  'On Trip': 'on-trip',
  'In Shop': 'in-shop',
  'Retired': 'retired',
};

export default function VehicleStatusBadge({ status }) {
  return <span className={`badge ${CLASS_MAP[status] || ''}`}>{status}</span>;
}