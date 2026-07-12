import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#3dd68c', '#f5a623', '#2dd4bf', '#e5484d'];

export default function UtilizationChart({ available, onTrip, inShop, retired }) {
  const data = [
    { name: 'Available', value: available },
    { name: 'On Trip', value: onTrip },
    { name: 'In Shop', value: inShop },
    { name: 'Retired', value: retired },
  ].filter((d) => d.value > 0);

  if (data.length === 0) return <div className="empty-state">No vehicle data yet.</div>;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />
          ))}
        </Pie>
        <Tooltip contentStyle={{ background: '#1a2029', border: '1px solid #262e3a', borderRadius: 8, fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
