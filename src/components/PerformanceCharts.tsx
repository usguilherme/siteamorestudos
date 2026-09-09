"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Stats } from "@/lib/stats";

const AXIS = "var(--faint)";
const GRID = "var(--border)";

const tooltipStyle = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  fontSize: 12,
  color: "var(--text)",
};

export function TimelineChart({ data }: { data: Stats["timeline"] }) {
  if (data.length < 2) {
    return <ChartEmpty>Responda em pelo menos 2 dias diferentes pra ver a evolução.</ChartEmpty>;
  }
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: -20 }}>
        <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" stroke={AXIS} tick={{ fontSize: 11 }} tickLine={false} />
        <YAxis
          domain={[0, 100]}
          stroke={AXIS}
          tick={{ fontSize: 11 }}
          tickLine={false}
          unit="%"
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={((v: number, _n: unknown, p: { payload?: { total?: number } }) => [
            `${v}% (${p?.payload?.total ?? 0} q.)`,
            "Acerto",
          ]) as never}
        />
        <Line
          type="monotone"
          dataKey="accuracy"
          stroke="var(--primary)"
          strokeWidth={2.5}
          dot={{ r: 3, fill: "var(--primary)" }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function AreaBarChart({ data }: { data: Stats["byArea"] }) {
  const filtered = data.filter((d) => d.total > 0);
  if (!filtered.length) return <ChartEmpty>Sem dados por área ainda.</ChartEmpty>;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={filtered} margin={{ top: 6, right: 8, bottom: 0, left: -20 }}>
        <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="short" stroke={AXIS} tick={{ fontSize: 11 }} tickLine={false} />
        <YAxis domain={[0, 100]} stroke={AXIS} tick={{ fontSize: 11 }} tickLine={false} unit="%" />
        <Tooltip
          cursor={{ fill: "var(--surface-2)" }}
          contentStyle={tooltipStyle}
          formatter={((v: number, _n: unknown, p: { payload?: { correct?: number; total?: number } }) => [
            `${v}% (${p?.payload?.correct ?? 0}/${p?.payload?.total ?? 0})`,
            "Acerto",
          ]) as never}
        />
        <Bar dataKey="accuracy" radius={[6, 6, 0, 0]} maxBarSize={64}>
          {filtered.map((d) => (
            <Cell
              key={d.name}
              fill={d.accuracy >= 70 ? "var(--ok)" : d.accuracy >= 40 ? "var(--primary)" : "var(--warn)"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

const REASON_COLORS = [
  "var(--primary)",
  "var(--accent)",
  "var(--warn)",
  "var(--ok)",
  "var(--faint)",
];

export function ReasonPieChart({ data }: { data: Stats["byReason"] }) {
  if (!data.length) return <ChartEmpty>Nenhum motivo de erro registrado ainda.</ChartEmpty>;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Tooltip contentStyle={tooltipStyle} />
        <Pie
          data={data}
          dataKey="count"
          nameKey="reason"
          innerRadius={45}
          outerRadius={80}
          paddingAngle={2}
        >
          {data.map((d, i) => (
            <Cell key={d.reason} fill={REASON_COLORS[i % REASON_COLORS.length]} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}

function ChartEmpty({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[220px] items-center justify-center rounded-xl bg-surface-2 px-6 text-center text-sm text-muted">
      {children}
    </div>
  );
}
