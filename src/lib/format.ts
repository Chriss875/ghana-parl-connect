export function formatCurrency(value: number, currency?: string) {
  try {
    if (currency) {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value);
    }
    // fallback to compact formatting
    return new Intl.NumberFormat(undefined, { notation: 'compact' }).format(value);
  } catch (e) {
    return String(value);
  }
}

export function formatPercent(value: number) {
  try {
    return `${(value * 100).toFixed(1)}%`;
  } catch (e) {
    return String(value);
  }
}

export function formatNumber(value: number) {
  try {
    return new Intl.NumberFormat().format(value);
  } catch (e) {
    return String(value);
  }
}

export function formatMetricValue(metric: any) {
  // metric: { value, value_numeric, type, unit }
  if (!metric) return '';
  const { value, value_numeric, type, unit } = metric;
  if (value_numeric !== undefined && value_numeric !== null) {
    if (type === 'currency') return formatCurrency(value_numeric, unit);
    if (type === 'percent') return formatPercent(value_numeric);
    if (type === 'number') return formatNumber(value_numeric);
  }
  // fallback: return textual value
  return value ?? '';
}
