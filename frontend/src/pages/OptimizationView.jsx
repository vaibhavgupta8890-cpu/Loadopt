import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Cpu,
  Truck,
  Package,
  Layers,
  Scale,
  Box,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  RefreshCw,
  Navigation,
  ListOrdered,
  ArrowRight,
  Info,
  ShieldCheck,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ProgressBar } from '../components/common/ProgressBar';
import { Toast } from '../components/common/Toast';
import { CargoBayVisualizer } from '../components/optimization/CargoBayVisualizer';

export const OptimizationView = () => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Algorithm configuration sliders
  const [priorityWeight, setPriorityWeight] = useState(1.5);
  const [destinationAffinityWeight, setDestinationAffinityWeight] = useState(1.0);
  const [utilizationBalanceWeight, setUtilizationBalanceWeight] = useState(1.0);
  const [activeTab, setActiveTab] = useState('cargo_bay'); // 'cargo_bay' | 'assignments' | 'loading_order' | 'unassigned'

  const { canModify } = useAuth();
  const navigate = useNavigate();

  // Try auto-loading existing assignments on initial mount
  useEffect(() => {
    const checkExisting = async () => {
      try {
        const metrics = await api.getDashboardMetrics();
        if (metrics.assigned_packages > 0) {
          // If packages are already assigned, run a fast dry query to retrieve the current plan
          const data = await api.runOptimization({
            priority_weight: 1.5,
            destination_affinity_weight: 1.0,
            utilization_balance_weight: 1.0,
          });
          setResult(data);
        }
      } catch (err) {
        // Silently ignore if not initialized
      }
    };
    checkExisting();
  }, []);

  const handleRunOptimization = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const data = await api.runOptimization({
        priority_weight: parseFloat(priorityWeight),
        destination_affinity_weight: parseFloat(destinationAffinityWeight),
        utilization_balance_weight: parseFloat(utilizationBalanceWeight),
      });
      setResult(data);
      setSuccess(`Optimization successful! Allocated ${data.assigned_packages_count}/${data.total_packages} packages across ${data.trucks.length} vehicles.`);
    } catch (err) {
      setError(err.message || 'Optimization failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Reset all active assignments back to PENDING? This clears current loads so you can re-run optimization with custom parameters.')) {
      return;
    }
    setResetting(true);
    try {
      await api.resetAssignments();
      setResult(null);
      setSuccess('All active assignments reset to PENDING. You can now re-run optimization.');
    } catch (err) {
      setError(err.message || 'Failed to reset assignments.');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Optimization Trigger */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Cpu className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Smart Truck Loading Optimization</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Multi-dimensional Knapsack Heuristic with LIFO Stacking & Nearest-Neighbor Route Sequencing
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {canModify && (
            <button
              onClick={handleReset}
              disabled={resetting || loading}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer disabled:opacity-50"
            >
              {resetting ? 'Resetting...' : 'Reset Loads'}
            </button>
          )}

          {canModify ? (
            <button
              onClick={handleRunOptimization}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition cursor-pointer disabled:opacity-50"
            >
              <Cpu className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Executing Knapsack Heuristic...' : 'Run Optimization Engine'}</span>
            </button>
          ) : (
            <div className="text-xs text-slate-500 px-3 py-2 bg-slate-100 rounded-xl">
              Viewer role (Optimization execution disabled)
            </div>
          )}
        </div>
      </div>

      {/* Notifications */}
      {error && <Toast type="error" message={error} onClose={() => setError('')} />}
      {success && <Toast type="success" message={success} onClose={() => setSuccess('')} />}

      {/* Algorithm Tuning Accordion / Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
            <Sliders className="w-4 h-4 text-blue-600" />
            <span>Configurable Heuristic Weights (Multi-Objective Optimization)</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">Heuristic Solver v2.2</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <div>
            <div className="flex justify-between text-xs font-medium mb-1.5">
              <span className="text-slate-700">Priority Weight Factor:</span>
              <span className="font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{priorityWeight}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="3.0"
              step="0.1"
              value={priorityWeight}
              onChange={(e) => setPriorityWeight(e.target.value)}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400 mt-1">Accelerates placement of HIGH priority medical/urgent cargo.</p>
          </div>

          <div>
            <div className="flex justify-between text-xs font-medium mb-1.5">
              <span className="text-slate-700">Destination Clustering Affinity:</span>
              <span className="font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{destinationAffinityWeight}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="3.0"
              step="0.1"
              value={destinationAffinityWeight}
              onChange={(e) => setDestinationAffinityWeight(e.target.value)}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400 mt-1">Groups packages going to identical destinations to reduce vehicle stops.</p>
          </div>

          <div>
            <div className="flex justify-between text-xs font-medium mb-1.5">
              <span className="text-slate-700">Utilization Tightness (Best-Fit):</span>
              <span className="font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{utilizationBalanceWeight}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="3.0"
              step="0.1"
              value={utilizationBalanceWeight}
              onChange={(e) => setUtilizationBalanceWeight(e.target.value)}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400 mt-1">Balances dense pack efficiency and minimizes leftover voids.</p>
          </div>
        </div>
      </div>

      {/* Results View */}
      {result ? (
        <div className="space-y-6">
          {/* Summary KPIs Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 font-semibold uppercase">Total Evaluated</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{result.total_packages}</p>
              <span className="text-[11px] text-slate-400">Total cargo units</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 font-semibold uppercase">Assigned Packages</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">{result.assigned_packages_count}</p>
              <span className="text-[11px] text-emerald-700 font-medium">Successfully placed</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 font-semibold uppercase">Fleet Weight Util</span>
              <p className="text-2xl font-black text-blue-600 mt-1">{result.overall_weight_utilization_pct}%</p>
              <span className="text-[11px] text-slate-400">Total payload mass</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 font-semibold uppercase">Fleet Volume Util</span>
              <p className="text-2xl font-black text-purple-600 mt-1">{result.overall_volume_utilization_pct}%</p>
              <span className="text-[11px] text-slate-400">Internal cargo space</span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 text-xs font-semibold gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('cargo_bay')}
              className={`py-3 px-4 border-b-2 transition flex items-center gap-2 cursor-pointer shrink-0 ${
                activeTab === 'cargo_bay'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Visual 2D Cargo Bays ({result.trucks.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('assignments')}
              className={`py-3 px-4 border-b-2 transition flex items-center gap-2 cursor-pointer shrink-0 ${
                activeTab === 'assignments'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>Truck Load Breakdown</span>
            </button>

            <button
              onClick={() => setActiveTab('loading_order')}
              className={`py-3 px-4 border-b-2 transition flex items-center gap-2 cursor-pointer shrink-0 ${
                activeTab === 'loading_order'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <ListOrdered className="w-4 h-4" />
              <span>Loading Order & LIFO Sequence</span>
            </button>

            <button
              onClick={() => setActiveTab('unassigned')}
              className={`py-3 px-4 border-b-2 transition flex items-center gap-2 cursor-pointer shrink-0 ${
                activeTab === 'unassigned'
                  ? 'border-rose-600 text-rose-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Unassigned Diagnostics ({result.unassigned.length})</span>
            </button>
          </div>

          {/* TAB 0: 2D VISUAL CARGO TRAILER BAYS */}
          {activeTab === 'cargo_bay' && (
            <div className="space-y-6">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold">Interactive 2D Cargo Bed Visualization</h4>
                  <p className="mt-0.5 text-blue-700">
                    Each trailer displays its assigned packages placed in sequence. Freight loaded first sits deepest in the cabin, while items for initial stops sit closest to the rear door.
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                {result.trucks.map((truck) => (
                  <CargoBayVisualizer key={truck.truck_id} truck={truck} />
                ))}
              </div>
            </div>
          )}

          {/* TAB 1: TRUCK LOAD CARDS */}
          {activeTab === 'assignments' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {result.trucks.map((t) => (
                <div
                  key={t.truck_id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 space-y-4 hover:shadow-md transition-shadow"
                >
                  {/* Truck Header */}
                  <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-slate-900">{t.truck_number}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold">
                          {t.assigned_packages.length} Packages
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{t.truck_model}</p>
                    </div>

                    <button
                      onClick={() => navigate('/delivery')}
                      className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>View Route ({t.total_route_distance_km} km)</span>
                    </button>
                  </div>

                  {/* Utilization Progress Bars */}
                  <div className="space-y-3 bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                    <ProgressBar
                      percentage={t.weight_utilization_pct}
                      label="Weight Capacity"
                      current={t.total_assigned_weight_kg}
                      max={t.max_weight_kg}
                      unit="kg"
                    />
                    <ProgressBar
                      percentage={t.volume_utilization_pct}
                      label="Volume Capacity"
                      current={t.total_assigned_volume_m3}
                      max={t.max_volume_m3}
                      unit="m³"
                    />
                  </div>

                  {/* Delivery Stops Overview */}
                  {t.delivery_stops.length > 0 && (
                    <div className="text-xs">
                      <span className="text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                        Delivery Sequence Stops:
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        {t.delivery_stops.map((stop, idx) => (
                          <React.Fragment key={stop.destination}>
                            <span className="px-2 py-1 rounded bg-slate-100 text-slate-800 font-medium text-[11px] flex items-center gap-1">
                              <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-bold">
                                {stop.stop_number}
                              </span>
                              {stop.destination} ({stop.package_count})
                            </span>
                            {idx < t.delivery_stops.length - 1 && (
                              <span className="text-slate-400 text-xs">&rarr;</span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Assigned Packages List */}
                  <div>
                    <span className="text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                      Manifest Cargo:
                    </span>
                    <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {t.assigned_packages.map((pkg) => (
                        <div
                          key={pkg.package_id}
                          className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 border border-slate-100"
                        >
                          <div className="truncate max-w-[240px]">
                            <span className="font-semibold text-slate-800">#{pkg.package_id}</span>{' '}
                            <span className="text-slate-600">{pkg.description}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-slate-500 text-[11px] font-mono">{pkg.weight_kg}kg</span>
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                                pkg.priority === 'HIGH'
                                  ? 'bg-rose-100 text-rose-700'
                                  : pkg.priority === 'MEDIUM'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {pkg.priority}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: PHYSICAL LOADING ORDER (LIFO) */}
          {activeTab === 'loading_order' && (
            <div className="space-y-6">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold">LIFO Reverse Delivery Loading Order Heuristic</h4>
                  <p className="mt-0.5 text-blue-700">
                    In physical freight operations, trucks are unloaded from the rear doors. Packages intended for later delivery stops are loaded first (at the front of the cargo bed). Heavier items are placed at the bottom to maintain stability and prevent crushing lighter goods.
                  </p>
                </div>
              </div>

              {result.trucks.map((t) => (
                <div key={t.truck_id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-900">
                      Loading Order Sequence for {t.truck_number} ({t.truck_model})
                    </h3>
                    <span className="text-xs text-slate-500">{t.assigned_packages.length} Packages to Load</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
                        <tr>
                          <th className="py-2.5 px-3">Load Order</th>
                          <th className="py-2.5 px-3">Package ID</th>
                          <th className="py-2.5 px-3">Description</th>
                          <th className="py-2.5 px-3">Weight</th>
                          <th className="py-2.5 px-3">Destination</th>
                          <th className="py-2.5 px-3">Loading Heuristic Rationale</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {t.assigned_packages.map((pkg) => (
                          <tr key={pkg.package_id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3">
                              <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                                #{pkg.loading_order}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-900">#{pkg.package_id}</td>
                            <td className="py-2.5 px-3 text-slate-800">{pkg.description}</td>
                            <td className="py-2.5 px-3 font-mono">{pkg.weight_kg} kg</td>
                            <td className="py-2.5 px-3">{pkg.destination}</td>
                            <td className="py-2.5 px-3 text-slate-500 text-[11px]">{pkg.assignment_reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: UNASSIGNED DIAGNOSTICS */}
          {activeTab === 'unassigned' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                <span className="font-bold">Transparent Feasibility Diagnostics:</span> The optimization engine enforces strict constraint boundaries. Items listed below could not be placed without violating fleet weight or volumetric limits.
              </div>

              {result.unassigned.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                  <p className="font-semibold text-slate-800">100% Allocation Achieved!</p>
                  <p className="mt-1">All eligible packages have been successfully assigned to trucks.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.unassigned.map((u) => (
                    <div
                      key={u.package_id}
                      className="bg-white p-4 rounded-xl border border-rose-200 shadow-xs space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-xs font-bold text-slate-900">Package #{u.package_id}</span>
                          <p className="text-xs text-slate-700 font-medium">{u.description}</p>
                        </div>
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded font-bold ${
                            u.priority === 'HIGH'
                              ? 'bg-rose-100 text-rose-700'
                              : u.priority === 'MEDIUM'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {u.priority}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>Weight: {u.weight_kg} kg</span>
                        <span>Volume: {u.volume_m3} m³</span>
                        <span>Dest: {u.destination}</span>
                      </div>

                      <div className="p-2.5 bg-rose-50 rounded-lg text-rose-800 text-xs font-medium flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <span>{u.reason}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white p-12 rounded-2xl border border-slate-200/80 text-center shadow-xs">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Cpu className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Load Optimization Ready</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-6">
            Click &ldquo;Run Optimization Engine&rdquo; above to execute the multi-capacity knapsack algorithm on current trucks and packages.
          </p>
          {canModify && (
            <button
              onClick={handleRunOptimization}
              disabled={loading}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-blue-500/20 transition cursor-pointer"
            >
              Start Optimization Engine
            </button>
          )}
        </div>
      )}
    </div>
  );
};
