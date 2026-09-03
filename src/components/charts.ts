/** Recharts v3 tooltip formatters are strictly typed against ValueType/NameType.
 *  This helper keeps chart code readable while satisfying the signature. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TooltipFormatter = any;

export function formatTip(
  fn: (value: number, name: string) => [string, string] | string,
): TooltipFormatter {
  return (value: unknown, name: unknown) => fn(Number(value), String(name ?? ''));
}

export const CHART_COLOURS = [
  '#0B2545', '#0E7C7B', '#2563EB', '#7C3AED', '#C9A227',
  '#DC2626', '#059669', '#D97706', '#0891B2', '#64748B',
];

export const AXIS_STYLE = { fontSize: 11, fill: '#5A6B85' };

export const TOOLTIP_STYLE = {
  contentStyle: {
    borderRadius: 10,
    border: '1px solid #E3E8F0',
    fontSize: 12,
    boxShadow: '0 10px 30px -12px rgba(11,37,69,.3)',
  },
};
