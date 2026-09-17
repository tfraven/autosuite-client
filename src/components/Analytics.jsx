import React, { useMemo, useState, useEffect } from 'react';
import {
  TrendingUp,
  Activity,
  Server,
  Database,
  Download,
  Layers,
  Bike,
  CreditCard,
  CheckCircle2,
  Cpu,
  BarChart3,
  Wallet,
  Package,
  FileCheck2,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';

const CHART_COLORS = {
  accent: 'var(--accent)',
  ok: 'var(--ok)',
  warn: 'var(--warn)',
  info: 'var(--info)',
  bad: 'var(--bad)',
  muted: 'var(--ink-4)'
};

function formatPKR(num) {
  return 'PKR ' + Number(num || 0).toLocaleString('en-PK');
}

function compactPKR(num) {
  const v = Number(num || 0);
  if (Math.abs(v) >= 1_000_000) return `PKR ${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `PKR ${(v / 1_000).toFixed(0)}k`;
  return formatPKR(v);
}

function formatLabel(value) {
  return String(value || '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function MomBadge({ value }) {
  const n = Number(value || 0);
  if (!Number.isFinite(n) || n === 0) {
    return <span className="glass-badge badge-muted text-xs">No change</span>;
  }
  const up = n > 0;
  return (
    <span className={`glass-badge text-xs ${up ? 'badge-emerald' : 'badge-rose'}`}>
      {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
      {Math.abs(n).toFixed(1)}% MoM
    </span>
  );
}

function ChartEmpty({ icon: Icon, text }) {
  return (
    <div className="analytics-empty-state">
      <div className="analytics-empty-icon">
        <Icon size={18} />
      </div>
      <p className="text-xs text-muted">{text}</p>
    </div>
  );
}

function DonutChart({ items, size = 176, thickness = 22, centerLabel, centerSub }) {
  const [hover, setHover] = useState(null);
  const total = items.reduce((sum, item) => sum + Number(item.value || 0), 0);
  const radius = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;
  const rings = items.map((item) => {
    const value = Number(item.value || 0);
    const length = total > 0 ? (value / total) * circumference : 0;
    const ring = { ...item, value, length, offset };
    offset += length;
    return ring;
  });

  const active = hover || null;
  const activePct = total > 0 && active ? Math.round((active.value / total) * 100) : 0;

  return (
    <div className="donut-chart-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="donut-svg">
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="var(--line)"
          strokeWidth={thickness}
        />
        {total > 0 && rings.map((ring) => (
          <circle
            key={ring.label}
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={ring.color}
            strokeWidth={hover?.label === ring.label ? thickness + 2 : thickness}
            strokeDasharray={`${ring.length} ${circumference - ring.length}`}
            strokeDashoffset={-ring.offset}
            strokeLinecap="butt"
            transform={`rotate(-90 ${cx} ${cy})`}
            className="donut-segment"
            onMouseEnter={() => setHover(ring)}
            onMouseLeave={() => setHover(null)}
          />
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" className="donut-center-label">
          {active ? `${activePct}%` : centerLabel}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" className="donut-center-sub">
          {active ? active.label : centerSub}
        </text>
      </svg>
      <ul className="donut-legend">
        {rings.map((ring) => (
          <li
            key={ring.label}
            className={hover?.label === ring.label ? 'is-active' : ''}
            onMouseEnter={() => setHover(ring)}
            onMouseLeave={() => setHover(null)}
          >
            <span className="legend-swatch" style={{ background: ring.color }} />
            <span className="legend-name">{ring.label}</span>
            <span className="legend-value">{ring.display || ring.value.toLocaleString('en-PK')}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ComboTrendChart({ series }) {
  const [hover, setHover] = useState(null);
  const width = 760;
  const height = 280;
  const pad = { top: 18, right: 44, bottom: 36, left: 52 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const n = Math.max(series.length, 1);
  const maxRevenue = Math.max(...series.map((d) => d.revenue || 0), 1);
  const maxUnits = Math.max(...series.map((d) => d.units || 0), 1);
  const slot = innerW / n;
  const barW = Math.min(28, slot * 0.38);

  const xAt = (i) => pad.left + slot * i + slot / 2;
  const yRevenue = (v) => pad.top + innerH - (v / maxRevenue) * innerH;
  const yUnits = (v) => pad.top + innerH - (v / maxUnits) * innerH;

  const linePath = series
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i)} ${yRevenue(d.revenue || 0)}`)
    .join(' ');
  const areaPath = series.length
    ? `${linePath} L ${xAt(series.length - 1)} ${pad.top + innerH} L ${xAt(0)} ${pad.top + innerH} Z`
    : '';

  const ticks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="svg-chart-container combo-chart">
      <svg viewBox={`0 0 ${width} ${height}`} className="analytics-svg-chart" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="revArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {ticks.map((t) => {
          const y = pad.top + innerH - t * innerH;
          return (
            <g key={t}>
              <line x1={pad.left} y1={y} x2={width - pad.right} y2={y} stroke="var(--line)" strokeDasharray="3 5" />
              <text x={pad.left - 8} y={y + 3} textAnchor="end" className="chart-axis-label">
                {compactPKR(maxRevenue * t).replace('PKR ', '')}
              </text>
              <text x={width - pad.right + 8} y={y + 3} textAnchor="start" className="chart-axis-label">
                {Math.round(maxUnits * t)}
              </text>
            </g>
          );
        })}

        {series.map((d, i) => {
          const h = Math.max(2, (d.units / maxUnits) * innerH);
          const x = xAt(i) - barW / 2;
          const y = pad.top + innerH - h;
          return (
            <rect
              key={`bar-${d.month}`}
              x={x}
              y={y}
              width={barW}
              height={h}
              rx="3"
              fill="var(--ok)"
              opacity={hover?.month === d.month ? 0.95 : 0.55}
            />
          );
        })}

        <path d={areaPath} fill="url(#revArea)" />
        <path d={linePath} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

        {series.map((d, i) => (
          <g key={`pt-${d.month}`}>
            <circle
              cx={xAt(i)}
              cy={yRevenue(d.revenue || 0)}
              r={hover?.month === d.month ? 5.5 : 3.5}
              fill="var(--accent)"
              stroke="var(--surface)"
              strokeWidth="2"
            />
            <text x={xAt(i)} y={height - 12} textAnchor="middle" className="chart-axis-label">
              {String(d.month).split(' ')[0]}
            </text>
            <rect
              x={pad.left + slot * i}
              y={pad.top}
              width={slot}
              height={innerH}
              fill="transparent"
              onMouseEnter={() => setHover(d)}
              onMouseLeave={() => setHover(null)}
            />
          </g>
        ))}
      </svg>

      {hover && (
        <div
          className="chart-floating-tooltip glass-panel"
          style={{ left: `${(xAt(series.indexOf(hover)) / width) * 100}%`, top: '18%' }}
        >
          <strong className="text-xs">{hover.month}</strong>
          <div className="font-mono text-cyan text-sm">{formatPKR(hover.revenue)}</div>
          <div className="text-xs text-muted">{hover.units} units · collected {compactPKR(hover.collected)}</div>
        </div>
      )}
    </div>
  );
}

function HorizontalBars({ rows, valueKey = 'count', maxValue, formatValue }) {
  const max = maxValue || Math.max(...rows.map((r) => Number(r[valueKey] || 0)), 1);
  return (
    <div className="top-models-bars">
      {rows.map((row) => {
        const value = Number(row[valueKey] || 0);
        const pct = Math.round((value / max) * 100);
        return (
          <div key={row.label} className="model-bar-row">
            <div className="bar-meta">
              <span className="bar-label">{row.label}</span>
              <span className="bar-metric">{formatValue ? formatValue(row) : value.toLocaleString('en-PK')}</span>
            </div>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${pct}%`, background: row.color || 'var(--accent)' }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StackedMeter({ segments, totalLabel }) {
  const total = segments.reduce((sum, s) => sum + Number(s.value || 0), 0) || 1;
  return (
    <div className="stacked-meter">
      <div className="stacked-meter-bar">
        {segments.map((s) => (
          <div
            key={s.label}
            title={`${s.label}: ${s.value}`}
            style={{ width: `${(Number(s.value || 0) / total) * 100}%`, background: s.color }}
          />
        ))}
      </div>
      <div className="stacked-meter-legend">
        {segments.map((s) => (
          <span key={s.label}>
            <i style={{ background: s.color }} />
            {s.label} · {s.display || s.value}
          </span>
        ))}
      </div>
      {totalLabel && <div className="stacked-meter-total">{totalLabel}</div>}
    </div>
  );
}

export default function Analytics() {
  const { isRomanUrdu } = useLanguage();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('business');
  const [stats, setStats] = useState(null);
  const [health, setHealth] = useState(null);
  const [retention, setRetention] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const [statsData, healthData, retentionData] = await Promise.all([
        api.getDashboardStats().catch(() => null),
        api.getHealth().catch(() => null),
        api.getAuditRetention().catch(() => null)
      ]);
      setStats(statsData);
      setHealth(healthData);
      setRetention(retentionData);
    } catch (err) {
      console.error('Error loading analytics:', err);
      toast.error('Failed to load telemetry data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
    const interval = setInterval(fetchAnalyticsData, 30000);
    return () => clearInterval(interval);
  }, []);

  const derived = useMemo(() => {
    const monthlyTrends = stats?.monthlyTrends?.length
      ? stats.monthlyTrends
      : [];

    const paymentItems = (stats?.paymentBreakdown || [])
      .filter((p) => p.amount > 0)
      .map((p, i) => ({
        label: formatLabel(p.method),
        value: p.amount,
        display: compactPKR(p.amount),
        color: [CHART_COLORS.ok, CHART_COLORS.accent, CHART_COLORS.warn, CHART_COLORS.info][i % 4]
      }));

    const channelItems = (stats?.channelBreakdown || [
      { channel: 'B2C', count: stats?.b2cCount || 0, revenue: 0 },
      { channel: 'B2B', count: stats?.b2bCount || 0, revenue: 0 }
    ]).map((c) => ({
      label: c.channel === 'B2C' ? 'Retail' : 'Wholesale',
      value: c.revenue || c.count || 0,
      display: c.revenue ? compactPKR(c.revenue) : `${c.count} sales`,
      color: c.channel === 'B2C' ? CHART_COLORS.accent : CHART_COLORS.info
    }));

    const inventoryItems = (stats?.inventoryByStatus || []).map((row) => ({
      label: formatLabel(row.status),
      value: row.count,
      color: {
        IN_STOCK: CHART_COLORS.ok,
        RESERVED: CHART_COLORS.warn,
        SOLD: CHART_COLORS.bad,
        PENDING_DELIVERY: CHART_COLORS.accent
      }[row.status] || CHART_COLORS.muted
    }));

    const typeItems = (stats?.salesByBikeType || []).map((row) => ({
      label: row.type === 'BRAND_NEW' ? 'Brand new' : row.type === 'USED' ? 'Used certified' : formatLabel(row.type),
      value: row.revenue,
      display: `${row.count} units · ${compactPKR(row.revenue)}`,
      color: row.type === 'USED' ? CHART_COLORS.info : CHART_COLORS.accent
    }));

    const installmentItems = (stats?.installmentBreakdown || []).map((row) => ({
      label: formatLabel(row.status),
      value: row.amount,
      display: `${row.count} · ${compactPKR(row.amount)}`,
      color: {
        PAID: CHART_COLORS.ok,
        PENDING: CHART_COLORS.warn,
        OVERDUE: CHART_COLORS.bad
      }[row.status] || CHART_COLORS.muted
    }));

    const paperworkItems = (stats?.paperworkBreakdown || []).map((row) => ({
      label: formatLabel(row.status),
      value: row.count,
      color: row.status === 'DELIVERED' ? CHART_COLORS.ok : CHART_COLORS.accent
    }));

    const collectionSegments = [
      { label: 'Collected', value: stats?.collectedRevenue || 0, color: CHART_COLORS.ok, display: compactPKR(stats?.collectedRevenue) },
      { label: 'Outstanding', value: stats?.totalOutstandingCredit || 0, color: CHART_COLORS.warn, display: compactPKR(stats?.totalOutstandingCredit) }
    ];

    const partsHealthy = Math.max(0, (stats?.partsOnHand || 0) - (stats?.lowStockPartsCount || 0));
    const partsSegments = [
      { label: 'Healthy stock', value: partsHealthy, color: CHART_COLORS.ok },
      { label: 'Low stock SKUs', value: stats?.lowStockPartsCount || 0, color: CHART_COLORS.bad }
    ];

    return {
      monthlyTrends,
      paymentItems,
      channelItems,
      inventoryItems,
      typeItems,
      installmentItems,
      paperworkItems,
      collectionSegments,
      partsSegments
    };
  }, [stats]);

  if (loading && !stats) {
    return (
      <div className="module-loading">
        <div className="spinner"></div>
        <span>{isRomanUrdu ? 'Analytics aur Telemetry load ho rahi hai…' : 'Loading business and technical analytics…'}</span>
      </div>
    );
  }

  const heapUsed = health?.memory?.heapUsedMb || 0;
  const rss = health?.memory?.rssMb || 1;
  const heapPct = Math.min(100, Math.round((heapUsed / rss) * 100));

  return (
    <div className="analytics-view">
      <div className="analytics-header-bar glass-panel">
        <div className="settings-header-copy">
          <h2>{isRomanUrdu ? 'Karobari aur Technical Jaiza' : 'Analytics & telemetry'}</h2>
          <p>
            {isRomanUrdu
              ? 'Revenue, stock, qistain aur server health ek jagah'
              : 'Revenue velocity, stock mix, collections and system health'}
          </p>
        </div>
        <div className="settings-tabs-bar" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'business'}
            className={`settings-tab ${activeTab === 'business' ? 'active' : ''}`}
            onClick={() => setActiveTab('business')}
          >
            <BarChart3 size={15} />
            <span className="settings-tab-label">{isRomanUrdu ? 'Karobar' : 'Business'}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'technical'}
            className={`settings-tab ${activeTab === 'technical' ? 'active' : ''}`}
            onClick={() => setActiveTab('technical')}
          >
            <Activity size={15} />
            <span className="settings-tab-label">{isRomanUrdu ? 'System' : 'Technical'}</span>
          </button>
        </div>
      </div>

      {activeTab === 'business' ? (
        <div className="business-analytics-container">
          <div className="kpi-grid">
            <div className="kpi-card glass-panel">
              <div className="kpi-header">
                <span className="kpi-title">{isRomanUrdu ? 'Kul Farokht' : 'Gross sales'}</span>
                <div className="kpi-icon icon-emerald"><TrendingUp size={18} /></div>
              </div>
              <div className="kpi-value">{formatPKR(stats?.totalRevenue)}</div>
              <div className="kpi-footer">
                <MomBadge value={stats?.revenueMoM} />
                <span className="kpi-subtext">{stats?.totalSalesCount || 0} invoices</span>
              </div>
            </div>

            <div className="kpi-card glass-panel">
              <div className="kpi-header">
                <span className="kpi-title">{isRomanUrdu ? 'Wasooli' : 'Collected cash'}</span>
                <div className="kpi-icon icon-cyan"><Wallet size={18} /></div>
              </div>
              <div className="kpi-value">{formatPKR(stats?.collectedRevenue)}</div>
              <div className="kpi-footer">
                <span className="glass-badge badge-cyan text-xs">
                  {stats?.totalRevenue
                    ? Math.round(((stats.collectedRevenue || 0) / stats.totalRevenue) * 100)
                    : 0}% collected
                </span>
                <span className="kpi-subtext">Avg ticket {compactPKR(stats?.avgTicket)}</span>
              </div>
            </div>

            <div className="kpi-card glass-panel">
              <div className="kpi-header">
                <span className="kpi-title">{isRomanUrdu ? 'Baqaya Qistain' : 'Receivables'}</span>
                <div className="kpi-icon icon-amber"><CreditCard size={18} /></div>
              </div>
              <div className="kpi-value">{formatPKR(stats?.totalOutstandingCredit)}</div>
              <div className="kpi-footer">
                <span className="glass-badge badge-amber text-xs">Open balances</span>
                <span className="kpi-subtext">{stats?.totalSalesCount || 0} sales book</span>
              </div>
            </div>

            <div className="kpi-card glass-panel">
              <div className="kpi-header">
                <span className="kpi-title">{isRomanUrdu ? 'Floor stock' : 'Floor stock'}</span>
                <div className="kpi-icon icon-purple"><Bike size={18} /></div>
              </div>
              <div className="kpi-value">{stats?.inStockBikes || 0}</div>
              <div className="kpi-footer">
                <span className="glass-badge badge-purple text-xs">{stats?.totalBikes || 0} total units</span>
                <span className="kpi-subtext">{stats?.soldBikes || 0} already sold</span>
              </div>
            </div>
          </div>

          <div className="chart-card glass-panel">
            <div className="chart-header">
              <div>
                <h3>{isRomanUrdu ? 'Mahana revenue aur units' : 'Revenue vs units sold'}</h3>
                <span className="text-xs text-muted">Last six billing months · bars are units, line is revenue</span>
              </div>
              <div className="revenue-legend">
                <span className="flex items-center gap-1 text-xs"><span className="legend-dot" style={{ background: 'var(--accent)' }} /> Revenue</span>
                <span className="flex items-center gap-1 text-xs"><span className="legend-dot" style={{ background: 'var(--ok)' }} /> Units</span>
                <MomBadge value={stats?.unitsMoM} />
              </div>
            </div>
            {derived.monthlyTrends.length === 0 ? (
              <ChartEmpty icon={BarChart3} text="No sales in the current 6-month window." />
            ) : (
              <ComboTrendChart series={derived.monthlyTrends} />
            )}
          </div>

          <div className="analytics-details-grid">
            <div className="card glass-panel chart-panel">
              <div className="card-header">
                <h3>{isRomanUrdu ? 'Retail vs wholesale' : 'Channel mix'}</h3>
                <span className="header-tag">By revenue</span>
              </div>
              {derived.channelItems.every((i) => !i.value) ? (
                <ChartEmpty icon={Layers} text="No channel sales yet." />
              ) : (
                <DonutChart
                  items={derived.channelItems}
                  centerLabel={stats?.totalSalesCount || 0}
                  centerSub="sales"
                />
              )}
            </div>

            <div className="card glass-panel chart-panel">
              <div className="card-header">
                <h3>{isRomanUrdu ? 'Adaigi ke tareeqe' : 'Payment mix'}</h3>
                <span className="header-tag">Settled volume</span>
              </div>
              {derived.paymentItems.length === 0 ? (
                <ChartEmpty icon={CreditCard} text="No settled payments recorded yet." />
              ) : (
                <DonutChart
                  items={derived.paymentItems}
                  centerLabel={compactPKR(stats?.totalRevenue).replace('PKR ', '')}
                  centerSub="volume"
                />
              )}
            </div>
          </div>

          <div className="analytics-details-grid">
            <div className="card glass-panel chart-panel">
              <div className="card-header">
                <h3>{isRomanUrdu ? 'Top models' : 'Best-selling models'}</h3>
                <span className="header-tag">Units & revenue</span>
              </div>
              {(stats?.topModels || []).length === 0 ? (
                <ChartEmpty icon={Bike} text="No completed sales recorded yet." />
              ) : (
                <HorizontalBars
                  rows={(stats.topModels || []).map((m) => ({
                    label: m.model,
                    count: m.count,
                    revenue: m.revenue
                  }))}
                  formatValue={(row) => `${row.count} · ${compactPKR(row.revenue)}`}
                />
              )}
            </div>

            <div className="card glass-panel chart-panel">
              <div className="card-header">
                <h3>{isRomanUrdu ? 'Stock ki soorat' : 'Inventory status'}</h3>
                <span className="header-tag">{stats?.totalBikes || 0} motorcycles</span>
              </div>
              {derived.inventoryItems.length === 0 ? (
                <ChartEmpty icon={Package} text="No stock records yet." />
              ) : (
                <DonutChart
                  items={derived.inventoryItems}
                  centerLabel={stats?.inStockBikes || 0}
                  centerSub="in stock"
                />
              )}
            </div>
          </div>

          <div className="analytics-details-grid">
            <div className="card glass-panel chart-panel">
              <div className="card-header">
                <h3>{isRomanUrdu ? 'Wasooli vs baqaya' : 'Collections vs receivables'}</h3>
                <span className="header-tag">Cash conversion</span>
              </div>
              <StackedMeter
                segments={derived.collectionSegments}
                totalLabel={`Booked ${compactPKR(stats?.totalRevenue)}`}
              />
              {derived.typeItems.length > 0 && (
                <div className="mt-4">
                  <div className="section-title mb-3">New vs used sales</div>
                  <DonutChart
                    items={derived.typeItems}
                    size={156}
                    centerLabel={stats?.totalSalesCount || 0}
                    centerSub="units"
                  />
                </div>
              )}
            </div>

            <div className="card glass-panel chart-panel">
              <div className="card-header">
                <h3>{isRomanUrdu ? 'Qistain aur paperwork' : 'Installments & paperwork'}</h3>
                <span className="header-tag">Ops pipeline</span>
              </div>
              {derived.installmentItems.length === 0 ? (
                <p className="text-xs text-muted mb-3">No installment schedules yet.</p>
              ) : (
                <StackedMeter segments={derived.installmentItems} />
              )}
              <div className="mt-4">
                <div className="section-title mb-3">Registration pipeline</div>
                {derived.paperworkItems.length === 0 ? (
                  <ChartEmpty icon={FileCheck2} text="No vehicle paperwork records." />
                ) : (
                  <HorizontalBars
                    rows={derived.paperworkItems}
                    formatValue={(row) => `${row.value} files`}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="technical-analytics-container">
          <div className="kpi-grid">
            <div className="kpi-card glass-panel">
              <div className="kpi-header">
                <span className="kpi-title">Database status</span>
                <div className="kpi-icon icon-emerald"><Database size={18} /></div>
              </div>
              <div className="kpi-value">
                <span className={health?.database?.status === 'healthy' ? 'text-emerald' : 'text-rose'}>
                  {health?.database?.status === 'healthy' ? 'Healthy' : 'Degraded'}
                </span>
                <span className="text-xs text-muted font-mono"> ({health?.database?.latencyMs || 0}ms)</span>
              </div>
              <div className="kpi-footer">
                <span className="glass-badge badge-emerald text-xs">PostgreSQL</span>
                <span className="kpi-subtext">Query round-trip</span>
              </div>
            </div>

            <div className="kpi-card glass-panel">
              <div className="kpi-header">
                <span className="kpi-title">Server uptime</span>
                <div className="kpi-icon icon-cyan"><Server size={18} /></div>
              </div>
              <div className="kpi-value font-mono">
                {Math.floor((health?.uptimeSeconds || 0) / 3600)}h {Math.floor(((health?.uptimeSeconds || 0) % 3600) / 60)}m
              </div>
              <div className="kpi-footer">
                <span className="glass-badge badge-cyan text-xs">Node.js</span>
                <span className="kpi-subtext">Process since last restart</span>
              </div>
            </div>

            <div className="kpi-card glass-panel">
              <div className="kpi-header">
                <span className="kpi-title">Memory footprint</span>
                <div className="kpi-icon icon-purple"><Cpu size={18} /></div>
              </div>
              <div className="kpi-value font-mono">
                {heapUsed} MB <span className="text-xs text-muted">/ {rss} MB RSS</span>
              </div>
              <div className="kpi-footer">
                <span className="glass-badge badge-purple text-xs">{heapPct}% heap</span>
                <span className="kpi-subtext">Garbage collector nominal</span>
              </div>
            </div>
          </div>

          <div className="analytics-details-grid">
            <div className="card glass-panel chart-panel">
              <div className="card-header">
                <h3>Runtime pressure</h3>
                <span className="header-tag">Heap vs RSS</span>
              </div>
              <DonutChart
                items={[
                  { label: 'Heap used', value: heapUsed, display: `${heapUsed} MB`, color: CHART_COLORS.accent },
                  { label: 'RSS headroom', value: Math.max(0, rss - heapUsed), display: `${Math.max(0, rss - heapUsed)} MB`, color: CHART_COLORS.ok }
                ]}
                centerLabel={`${heapPct}%`}
                centerSub="heap"
              />
              <div className="mt-3">
                <div className="section-title mb-3">Parts inventory health</div>
                <StackedMeter
                  segments={derived.partsSegments}
                  totalLabel={`On-hand value ${compactPKR(stats?.partsStockValue)} · ${stats?.partsOnHand || 0} units`}
                />
              </div>
            </div>

            <div className="card glass-panel">
              <div className="card-header">
                <div>
                  <h3>Audit log retention</h3>
                  <span className="text-xs text-muted">90-day dealership compliance window</span>
                </div>
                <button className="btn btn-outline btn-sm" onClick={() => api.exportAuditCsv()}>
                  <Download size={14} /> Export CSV
                </button>
              </div>

              <div className="retention-grid-stats mt-3">
                <div className="stat-box">
                  <span className="text-xs text-muted">Policy</span>
                  <h4 className="text-emerald flex items-center gap-1 mt-1">
                    <CheckCircle2 size={16} /> 90 days minimum
                  </h4>
                </div>
                <div className="stat-box">
                  <span className="text-xs text-muted">Audit records</span>
                  <h4 className="font-mono mt-1">{retention?.database?.totalAuditRecords || 0} events</h4>
                </div>
                <div className="stat-box">
                  <span className="text-xs text-muted">Rotating files</span>
                  <h4 className="font-mono mt-1">{retention?.fileSystem?.activeLogFiles || 0} logs</h4>
                </div>
                <div className="stat-box">
                  <span className="text-xs text-muted">Status</span>
                  <span className="glass-badge badge-emerald text-xs mt-1">
                    {retention?.policy?.complianceStatus || 'COMPLIANT_90_DAYS'}
                  </span>
                </div>
              </div>

              {retention?.fileSystem?.files && (
                <div className="active-log-files mt-3 pt-3 border-t border-line-soft">
                  <span className="text-xs text-muted block mb-2">Recent log files:</span>
                  <div className="flex flex-wrap gap-2">
                    {retention.fileSystem.files.map((file, idx) => (
                      <span key={idx} className="glass-badge text-xs font-mono">{file}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
