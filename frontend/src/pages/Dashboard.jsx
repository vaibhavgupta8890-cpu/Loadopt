import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck,
  Package,
  Layers,
  Cpu,
  SlidersHorizontal,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  TrendingUp,
  RefreshCw,
  Zap,
  Radio,
  ArrowRight,
  ShieldCheck,
  Navigation,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatCard } from '../components/common/StatCard';
import { ProgressBar } from '../components/common/ProgressBar';

export const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fleetFilter, setFleetFilter] = useState('ALL'); // 'ALL' | 'AVAILABLE' | 'LOADED'
  const { canModify } = useAuth();
  const navigate = useNavigate();

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError('');
      const metrics = await api.getDashboardMetrics();
      setData(metrics);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl shadow-sm animate-pulse">
          <RefreshCw className="w-8 h-8 animate-spin" />
        </div>
        <p className="text-sm font-semibold text-slate-700">Loading live operational telemetry from database...</p>
        <span className="text-xs text-slate-400">Evaluating fleet capacity and package metrics</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchMetrics}
            className="px-3.5 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded-lg hover:bg-rose-700 transition cursor-pointer"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Filter trucks based on fleetFilter tab
  const filteredTrucks = (data?.truck_utilization_summary || []).filter((t) => {
    if (fleetFilter === 'AVAILABLE') return t.status === 'AVAILABLE';
    if (fleetFilter === 'LOADED') return t.assigned_weight_kg > 0 || t.status === 'IN_TRANSIT';
    return true;
  });

  // Chart data formatting
  const truckUtilizationChartData = (data?.truck_utilization_summary || []).map((t) => ({
    name: t.truck_number,
    weight: t.weight_utilization_pct,
    volume: t.volume_utilization_pct,
  }));

  const priorityChartData = Object.entries(data?.priority_distribution || {}).map(([key, value]) => ({
    name: key,
    value,
  }));

  const PRIORITY_COLORS = {
    HIGH: '#EF4444',
    MEDIUM: '#F59E0B',
    LOW: '#3B82F6',
  };

  const highPriorityPendingCount = data?.high_priority_pending_packages ?? 0;

  return (
    <div className="space-y-6">
      {/* Top Banner & Operational Command Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Live Telematics Active
            </span>
            <span className="text-xs text-slate-400">&bull; Central Dispatch Hub</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight mt-1">
            Logistics Operations Command Center
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time payload capacity tracking, multi-knapsack optimization diagnostics, and active fleet routing.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => navigate('/optimization')}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition cursor-pointer"
          >
            <Cpu className="w-4 h-4" />
            <span>Optimize Fleet Load</span>
          </button>
          <button
            onClick={() => navigate('/simulation')}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4 text-slate-300" />
            <span>What-If Simulation</span>
          </button>
          {canModify && (
            <>
              <button
                onClick={() => navigate('/trucks')}
                className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                + Add Truck
              </button>
              <button
                onClick={() => navigate('/packages')}
                className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                + Add Package
              </button>
            </>
          )}
          <button
            onClick={fetchMetrics}
            className="p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition cursor-pointer"
            title="Refresh Live Metrics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* High-Priority Urgent Dispatch Alert Ribbon */}
      {highPriorityPendingCount > 0 && (
        <div className="p-4 bg-gradient-to-r from-rose-500 via-rose-600 to-amber-600 rounded-2xl text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-xs shrink-0">
              <Zap className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <div className="font-extrabold text-sm flex items-center gap-2">
                <span>Urgent Cargo Dispatch Required</span>
                <span className="bg-white text-rose-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                  Action Needed
                </span>
              </div>
              <p className="text-xs text-white/90 mt-0.5">
                {highPriorityPendingCount} high-priority packages are pending allocation without an assigned truck.
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/optimization')}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-rose-700 font-extrabold text-xs rounded-xl shadow-xs transition cursor-pointer shrink-0"
          >
            <span>Assign via Optimization</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Fleet"
          value={data?.total_trucks ?? 0}
          subtitle={`${data?.available_trucks ?? 0} vehicles ready to load`}
          icon={Truck}
          color="blue"
        />
        <StatCard
          title="Cargo Inventory"
          value={data?.total_packages ?? 0}
          subtitle={`${data?.assigned_packages ?? 0} allocated • ${data?.unassigned_packages ?? 0} pending`}
          icon={Package}
          color="green"
        />
        <StatCard
          title="Avg Weight Efficiency"
          value={`${data?.average_weight_utilization_pct ?? 0}%`}
          subtitle="Fleet-wide mass utilization"
          icon={TrendingUp}
          color="purple"
        />
        <StatCard
          title="Avg Volume Fill"
          value={`${data?.average_volume_utilization_pct ?? 0}%`}
          subtitle="Internal cubic meter capacity"
          icon={Layers}
          color="amber"
        />
      </div>

      {/* Visualizations Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Truck Utilization Bar Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Fleet Payload Capacity Analysis (%)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Weight vs Volume utilization percentage per vehicle</p>
            </div>
            <button
              onClick={() => navigate('/trucks')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              Manage Fleet <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64">
            {truckUtilizationChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={truckUtilizationChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '12px',
                      border: '1px solid #E2E8F0',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="weight" name="Weight Util %" fill="#2563EB" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="volume" name="Volume Util %" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No truck capacity data recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Priority & Delivery Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Cargo Priority Distribution
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">High, Medium, and Standard shipment classes</p>
          </div>

          <div className="h-52 my-2">
            {priorityChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={priorityChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {priorityChartData.map((entry) => (
                      <Cell key={`cell-${entry.name}`} fill={PRIORITY_COLORS[entry.name] || '#94A3B8'} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No package priority data.
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Pending unallocated cargo?</span>
            <button
              onClick={() => navigate('/optimization')}
              className="text-blue-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Solve Allocation</span> &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Fleet Live Payload Matrix & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fleet Payload Status with Interactive Filters */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Fleet Payload Status & Utilization
              </h3>
              <p className="text-xs text-slate-500">Live vehicle load monitors with capacity thresholds</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setFleetFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  fleetFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                All ({data?.truck_utilization_summary?.length || 0})
              </button>
              <button
                onClick={() => setFleetFilter('AVAILABLE')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  fleetFilter === 'AVAILABLE'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Ready
              </button>
              <button
                onClick={() => setFleetFilter('LOADED')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  fleetFilter === 'LOADED' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Loaded
              </button>
            </div>
          </div>

          <div className="space-y-3.5">
            {filteredTrucks.map((t) => (
              <div
                key={t.truck_id}
                className="p-4 rounded-xl border border-slate-200/70 bg-gradient-to-r from-slate-50/60 to-white hover:border-blue-300 hover:shadow-xs transition space-y-3"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-extrabold text-slate-900 text-sm">{t.truck_number}</span>
                      <span className="text-slate-500 text-xs ml-2 truncate max-w-[200px]">{t.truck_model}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                        t.status === 'AVAILABLE'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {t.status}
                    </span>
                    <button
                      onClick={() => navigate('/delivery')}
                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 px-2 py-0.5 rounded hover:bg-blue-50 transition cursor-pointer"
                    >
                      Route Details &rarr;
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <ProgressBar
                    percentage={t.weight_utilization_pct}
                    label="Weight Payload"
                    current={t.assigned_weight_kg}
                    max={t.max_weight_kg}
                    unit="kg"
                    height="h-2"
                  />
                  <ProgressBar
                    percentage={t.volume_utilization_pct}
                    label="Volume Payload"
                    current={t.assigned_volume_m3}
                    max={t.max_volume_m3}
                    unit="m³"
                    height="h-2"
                  />
                </div>
              </div>
            ))}

            {filteredTrucks.length === 0 && (
              <div className="py-8 text-center text-xs text-slate-400">
                No vehicles matching this filter.
              </div>
            )}
          </div>
        </div>

        {/* Audit / Live Activity Feed */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                System Audit Stream
              </h3>
              <span className="text-[11px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                Live DB Sync
              </span>
            </div>

            <div className="space-y-3 overflow-y-auto max-h-[380px] pr-1">
              {(data?.recent_activities || []).map((act) => (
                <div key={act.id} className="flex items-start gap-3 text-xs pb-3 border-b border-slate-100 last:border-0">
                  <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 shrink-0 mt-0.5">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{act.action.replace(/_/g, ' ')}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-500 text-[11px] mt-0.5 line-clamp-2">{act.details || act.entity}</p>
                  </div>
                </div>
              ))}
              {(!data?.recent_activities || data.recent_activities.length === 0) && (
                <p className="text-xs text-slate-400 py-6 text-center">No recent audit trail logs.</p>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs text-slate-500">
            <span>RDBMS Audit Logging</span>
            <span className="font-mono text-slate-400 text-[10px]">ISO 27001 Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
};
