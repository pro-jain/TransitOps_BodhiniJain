import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function ROIChart({ data }) {
  const chartData = data
    .filter((r) => r.roi !== null)
    .map((r) => ({ name: r.regNumber, roi: Math.round(r.roi * 1000) / 1000 }));

  if (chartData.length === 0) return <div className="empty-state">No ROI data yet — complete some trips first.</div>;

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#262e3a" />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9aa4b2' }} />
        <YAxis tick={{ fontSize: 11, fill: '#9aa4b2' }} />
        <Tooltip contentStyle={{ background: '#1a2029', border: '1px solid #262e3a', borderRadius: 8, fontSize: 12 }} />
        <Bar dataKey="roi" radius={[4, 4, 0, 0]}>
          {chartData.map((d, i) => (
            <Cell key={i} fill={d.roi >= 0 ? '#3dd68c' : '#e5484d'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
