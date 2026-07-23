type BarDatum = { label: string; value: number; color: string };

export function BarChart({ title, data }: { title: string; data: BarDatum[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <div>
      <h3 className="mb-3 text-sm font-medium text-slate-700">{title}</h3>
      <div className="flex flex-col gap-2">
        {data.map((d) => (
          <div key={d.label} className="flex items-center gap-3">
            <span className="w-28 shrink-0 text-xs text-slate-600">{d.label}</span>
            <div className="h-4 flex-1 overflow-hidden rounded-sm bg-slate-100">
              <div
                className="h-full rounded-e-sm"
                style={{
                  width: `${Math.max(2, (d.value / max) * 100)}%`,
                  backgroundColor: d.color,
                }}
              />
            </div>
            <span className="w-6 shrink-0 text-end text-xs font-medium text-slate-700" dir="ltr">
              {d.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
