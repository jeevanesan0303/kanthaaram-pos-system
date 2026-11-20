import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';

type Period = 'Today' | 'This Week' | 'This Month' | 'Select Date';

interface SalesRow {
  id: string;
  created_at: string;
  total: number | string;
}

const DAY = 86_400_000;
const OFFSET = 330 * 60_000;

const COLORS = [
  '#10b981',
  '#3b82f6',
  '#a78bfa',
  '#f59e0b',
  '#f472b6',
  '#06b6d4',
  '#f97316',
];

function sriLankaToday(): string {
  return new Date(Date.now() + OFFSET).toISOString().slice(0, 10);
}

function dateLabel(value: string): string {
  return new Date(`${value}T00:00:00+05:30`).toLocaleDateString(
    'en-GB',
    {
      timeZone: 'Asia/Colombo',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    },
  );
}

export const SalesOverviewChart: React.FC<{
  currency: string;
  refreshKey?: unknown;
}> = ({ currency, refreshKey }) => {
  const { theme } = useTheme();
  const dark = theme === 'dark';

  const [period, setPeriod] = useState<Period>('This Week');
  const [selectedDate, setSelectedDate] = useState(sriLankaToday);
  const [rows, setRows] = useState<SalesRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const today = sriLankaToday();

  const range = useMemo(() => {
    const date = period === 'Select Date' ? selectedDate : today;
    const midnight = new Date(`${date}T00:00:00Z`);

    let start = midnight.getTime();
    let count = 24;
    let step = 60 * 60_000;
    let labels = Array.from(
      { length: 24 },
      (_, hour) => `${String(hour).padStart(2, '0')}:00`,
    );

    if (period === 'This Week') {
      const mondayOffset = (midnight.getUTCDay() + 6) % 7;
      start -= mondayOffset * DAY;
      count = 7;
      step = DAY;
      labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    } else if (period === 'This Month') {
      start = Date.UTC(
        midnight.getUTCFullYear(),
        midnight.getUTCMonth(),
        1,
      );

      count = new Date(
        Date.UTC(
          midnight.getUTCFullYear(),
          midnight.getUTCMonth() + 1,
          0,
        ),
      ).getUTCDate();

      step = DAY;
      labels = Array.from({ length: count }, (_, index) =>
        String(index + 1),
      );
    }

    // Convert Sri Lanka wall-clock boundaries to UTC.
    const from = start - OFFSET;
    const to = from + count * step;

    return {
      from,
      to,
      count,
      step,
      labels,
      startDate: new Date(start).toISOString().slice(0, 10),
      endDate: new Date(start + (count * step) - DAY)
        .toISOString()
        .slice(0, 10),
    };
  }, [period, selectedDate, today]);

  useEffect(() => {
    let cancelled = false;

    async function loadSales() {
      setLoading(true);
      setError('');
      setRows([]);

      try {
        const result: SalesRow[] = [];
        let last: SalesRow | undefined;

        // Fetch every page so historical totals aren't limited
        // to the orders currently loaded in AppContext.
        for (;;) {
          let query = supabase
            .from('orders')
            .select('id, created_at, total')
            .eq('is_deleted', false)
            .eq('order_status', 'Completed')
            .eq('payment_status', 'Paid')
            .gte('created_at', new Date(range.from).toISOString())
            .lt('created_at', new Date(range.to).toISOString())
            .order('created_at', { ascending: true })
            .order('id', { ascending: true })
            .limit(200);

          if (last) {
            query = query.or(
              `created_at.gt.${last.created_at},and(created_at.eq.${last.created_at},id.gt.${last.id})`,
            );
          }

          const { data, error: queryError } = await query;

          if (cancelled) return;
          if (queryError) throw new Error(queryError.message);

          const page = (data || []) as SalesRow[];
          if (!page.length) break;

          result.push(...page);
          last = page[page.length - 1];
        }

        if (!cancelled) setRows(result);
      } catch (caught) {
        if (!cancelled) {
          setError(
            caught instanceof Error
              ? caught.message
              : 'Unable to load sales.',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadSales();

    return () => {
      cancelled = true;
    };
  }, [range, refreshKey]);

  const totals = useMemo(() => {
    const values = Array<number>(range.count).fill(0);

    for (const row of rows) {
      const index = Math.floor(
        (new Date(row.created_at).getTime() - range.from) /
          range.step,
      );

      const amount = Number(row.total);

      if (
        index >= 0 &&
        index < values.length &&
        Number.isFinite(amount)
      ) {
        values[index] += amount;
      }
    }

    return values;
  }, [rows, range]);

  const total = totals.reduce((sum, value) => sum + value, 0);
  const maximum = Math.max(...totals, 1);

  const money = (value: number) =>
    `${currency} ${value.toLocaleString('en-GB', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const foreground = dark ? '#f1f5f9' : '#17251c';
  const muted = dark ? '#b8c9c1' : '#52645a';
  const border = dark ? '#344b40' : '#d7e2db';

  const controlStyle: React.CSSProperties = {
    backgroundColor: dark ? '#1c3026' : '#ffffff',
    color: foreground,
    border: `1px solid ${border}`,
    colorScheme: dark ? 'dark' : 'light',
    borderRadius: 10,
    padding: '8px 10px',
    fontSize: 12,
    fontWeight: 600,
    minHeight: 38,
  };

  return (
    <div
      className="lg:col-span-2 rounded-2xl p-5 shadow-2xs"
      style={{
        backgroundColor: dark ? '#101d17' : '#ffffff',
        border: `1px solid ${border}`,
        minWidth: 0,
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3
            className="font-extrabold text-sm font-serif"
            style={{ color: foreground }}
          >
            Sales Overview
          </h3>

          <p className="text-xs mt-1" style={{ color: muted }}>
            {dateLabel(range.startDate)}
            {range.startDate !== range.endDate &&
              ` – ${dateLabel(range.endDate)}`}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            aria-label="Sales period"
            value={period}
            onChange={event =>
              setPeriod(event.target.value as Period)
            }
            style={controlStyle}
          >
            <option value="Today">Today</option>
            <option value="This Week">This Week</option>
            <option value="This Month">This Month</option>
            <option value="Select Date">Select Date</option>
          </select>

          {period === 'Select Date' && (
            <input
              type="date"
              aria-label="Select sales date"
              value={selectedDate}
              max={today}
              onChange={event => {
                if (event.target.value) {
                  setSelectedDate(event.target.value);
                }
              }}
              style={controlStyle}
            />
          )}
        </div>
      </div>

      {loading ? (
        <div
          className="h-64 flex items-center justify-center text-sm"
          role="status"
          style={{ color: muted }}
        >
          Loading sales…
        </div>
      ) : error ? (
        <div
          className="py-12 text-sm"
          role="alert"
          style={{ color: dark ? '#fca5a5' : '#b91c1c' }}
        >
          {error}
        </div>
      ) : (
        <>
          <div className="mt-4 mb-2">
            <strong style={{ color: foreground }}>
              {money(total)}
            </strong>
            <span
              className="ml-2 text-xs"
              style={{ color: muted }}
            >
              Paid completed sales
            </span>
          </div>

          {total === 0 && (
            <p className="text-xs" style={{ color: muted }}>
              No paid completed sales for this period.
            </p>
          )}

          <div
            className="overflow-x-auto mt-4 pb-2"
            aria-label="Sales bar chart"
          >
            <div
              style={{
                display: 'flex',
                gap: 10,
                minWidth: range.count * 64,
              }}
            >
              {totals.map((value, index) => (
                <div
                  key={index}
                  style={{ flex: 1, minWidth: 54 }}
                >
                  <div
                    style={{
                      height: 200,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                      alignItems: 'center',
                      borderBottom: `1px solid ${border}`,
                    }}
                  >
                    <span
                      style={{
                        color: muted,
                        fontSize: 10,
                        marginBottom: 5,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {value.toLocaleString('en-GB', {
                        maximumFractionDigits: 2,
                      })}
                    </span>

                    <div
                      title={`${range.labels[index]}: ${money(value)}`}
                      aria-label={`${range.labels[index]}: ${money(value)}`}
                      style={{
                        width: '70%',
                        maxWidth: 46,
                        height: value > 0
                          ? Math.max(3, (value / maximum) * 165)
                          : 0,
                        backgroundColor:
                          COLORS[index % COLORS.length],
                        borderRadius: '7px 7px 0 0',
                        transition: 'height 200ms ease',
                      }}
                    />
                  </div>

                  <div
                    style={{
                      color: muted,
                      textAlign: 'center',
                      fontSize: 10,
                      fontWeight: 600,
                      marginTop: 9,
                    }}
                  >
                    {range.labels[index]}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs mt-3" style={{ color: muted }}>
            {currency} · Sri Lanka time ·
            {' '}
            {range.count === 24 ? 'Hourly sales' : 'Daily sales'}
            {' '}· Scroll horizontally to see all bars.
          </p>
        </>
      )}
    </div>
  );
};