export default function KpiCard({ label, value, tone }) {
  return (
    <div className="kpi-card">
      <div className="label">{label}</div>
      <div className={`value${tone ? ` ${tone}` : ''}`}>{value}</div>
    </div>
  );
}
