"use client";

import { useMemo } from "react";

import { formatCurrency } from "@/lib/utils/format";

/**
 * Revenue sparkline.
 *
 * Hand-rolled SVG rather than a charting library: this is one series with no
 * interaction beyond a tooltip, and pulling in a chart runtime for it would
 * cost more in bundle size than the whole admin dashboard.
 *
 * Values are also exposed as a visually hidden table, so the data is reachable
 * by a screen reader rather than being conveyed only by shape.
 */
export function RevenueChart({
  data,
  currencySymbol,
}: {
  data: { date: string; label: string; total: number }[];
  currencySymbol: string;
}) {
  const { path, area, max, points } = useMemo(() => {
    const width = 1000;
    const height = 220;
    const padding = 8;
    const maxValue = Math.max(...data.map((d) => d.total), 1);

    const step = data.length > 1 ? (width - padding * 2) / (data.length - 1) : 0;

    const coords = data.map((d, i) => ({
      ...d,
      x: padding + i * step,
      y: height - padding - (d.total / maxValue) * (height - padding * 2),
    }));

    const line = coords
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(" ");

    const filled =
      coords.length > 0
        ? `${line} L ${coords[coords.length - 1].x.toFixed(1)} ${height - padding} L ${coords[0].x.toFixed(1)} ${height - padding} Z`
        : "";

    return { path: line, area: filled, max: maxValue, points: coords };
  }, [data]);

  const total = data.reduce((sum, d) => sum + d.total, 0);
  const peak = data.reduce((best, d) => (d.total > best.total ? d : best), data[0]);

  return (
    <figure>
      <svg
        viewBox="0 0 1000 220"
        preserveAspectRatio="none"
        role="img"
        aria-label={`Revenue over ${data.length} days, totalling ${formatCurrency(total, currencySymbol)}. Peak of ${formatCurrency(peak?.total ?? 0, currencySymbol)} on ${peak?.label}.`}
        className="h-52 w-full"
      >
        <defs>
          <linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-champagne-400)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--color-champagne-400)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Horizontal guides at quarter intervals. */}
        {[0.25, 0.5, 0.75].map((fraction) => (
          <line
            key={fraction}
            x1="8"
            x2="992"
            y1={220 - 8 - fraction * (220 - 16)}
            y2={220 - 8 - fraction * (220 - 16)}
            stroke="var(--color-line-subtle)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        ))}

        <path d={area} fill="url(#revenue-fill)" />
        <path
          d={path}
          fill="none"
          stroke="var(--color-charcoal-900)"
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />

        {points.map((point) =>
          point.total > 0 ? (
            <circle
              key={point.date}
              cx={point.x}
              cy={point.y}
              r="2.5"
              fill="var(--color-charcoal-900)"
              vectorEffect="non-scaling-stroke"
            >
              <title>
                {point.label}: {formatCurrency(point.total, currencySymbol)}
              </title>
            </circle>
          ) : null,
        )}
      </svg>

      <figcaption className="mt-3 flex flex-wrap justify-between gap-4 text-xs text-ink-subtle">
        <span>{data[0]?.label}</span>
        <span>
          Peak {formatCurrency(max, currencySymbol, { compact: true })}
          <span className="mx-1.5" aria-hidden="true">
            ·
          </span>
          Total {formatCurrency(total, currencySymbol, { compact: true })}
        </span>
        <span>{data[data.length - 1]?.label}</span>
      </figcaption>

      {/* The same data, reachable by assistive technology. */}
      <table className="sr-only">
        <caption>Revenue collected per day</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Collected</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.date}>
              <th scope="row">{d.label}</th>
              <td>{formatCurrency(d.total, currencySymbol)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
