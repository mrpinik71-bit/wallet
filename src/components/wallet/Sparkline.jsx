import { Line, LineChart, ResponsiveContainer } from "recharts";

export default function Sparkline({ data, positive = true, height = 32 }) {
  if (!data || data.length < 2) return <div style={{ height }} className="w-full" />;
  const stroke = positive ? "hsl(var(--primary))" : "hsl(var(--destructive))";
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data.map((value, index) => ({ index, value }))}>
          <Line type="monotone" dataKey="value" stroke={stroke} strokeWidth={1.5} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}