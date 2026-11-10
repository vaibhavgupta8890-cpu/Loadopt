import React, { useEffect, useState } from 'react';
import {
  FlaskConical,
  Truck,
  Package,
  SlidersHorizontal,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Plus,
  ArrowDownRight,
  Layers,
  Scale,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Toast } from '../components/common/Toast';
import { ProgressBar } from '../components/common/ProgressBar';

export const WhatIfSimulation = () => {
  const [trucks, setTrucks] = useState([]);
  const [scenarioType, setScenarioType] = useState('EXCLUDE_TRUCK'); // 'EXCLUDE_TRUCK' | 'URGENT_PACKAGE' | 'REDUCE_CAPACITY'
  const [selectedTruckId, setSelectedTruckId] = useState('');
  const [capacityReductionPct, setCapacityReductionPct] = useState(50);

  // Urgent proposed package form
  const [proposedPackage, setProposedPackage] = useState({
    description: 'Emergency Hospital Oxygen Concentrators',
    weight_kg: 1800,
    length_cm: 180,
    width_cm: 120,
    height_cm: 140,
    destination: 'Gurgaon Sector 18',
    priority: 'HIGH',
  });

  const [simResult, setSimResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { canModify } = useAuth();

  useEffect(() => {
    const fetchFleet = async () => {
      try {
        const tList = await api.getTrucks();
        setTrucks(tList);
        if (tList.length > 0) {
          setSelectedTruckId(tList[0].truck_id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchFleet();
  }, []);

  const handleRunSimulation = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        scenario_type: scenarioType,
        excluded_truck_id: scenarioType === 'EXCLUDE_TRUCK' ? parseInt(selectedTruckId) : null,
        reduced_capacity_truck_id: scenarioType === 'REDUCE_CAPACITY' ? parseInt(selectedTruckId) : null,
        capacity_reduction_pct: scenarioType === 'REDUCE_CAPACITY' ? parseFloat(capacityReductionPct) : null,
        proposed_package: scenarioType === 'URGENT_PACKAGE' ? proposedPackage : null,
      };

      const data = await api.runSimulation(payload);
      setSimResult(data);
      setSuccess('What-If simulation evaluated successfully in memory. Database remains unchanged.');
    } catch (err) {
      setError(err.message || 'Simulation run failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPlan = async () => {
    if (!simResult) return;
    if (
      !window.confirm(
        'Are you sure you want to apply this simulated plan to the LIVE database? Active assignments will be updated transactionally.'
      )
    ) {
      return;
    }

    setApplying(true);
    setError('');
    setSuccess('');
    try {
      const data = await api.applySimulation({
        simulated_result: simResult.simulated_result,
        persist_proposed_package: scenarioType === 'URGENT_PACKAGE',
        proposed_package: scenarioType === 'URGENT_PACKAGE' ? proposedPackage : null,
      });
      setSuccess(`Revised plan successfully applied! Assigned ${data.assigned_packages} packages in DB.`);
    } catch (err) {
      setError(err.message || 'Failed to apply plan.');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <FlaskConical className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">What-If Logistics Simulation Lab</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Test scenarios (vehicle breakdown, urgent priority shipments, capacity restrictions) non-destructively in-memory before applying.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRunSimulation}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition cursor-pointer disabled:opacity-50"
          >
            <FlaskConical className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Simulating...' : 'Run Simulation'}</span>
          </button>

          {simResult && canModify && (
            <button
              onClick={handleApplyPlan}
              disabled={applying}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-500/20 transition cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{applying ? 'Committing Transaction...' : 'Apply Revised Plan'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {error && <Toast type="error" message={error} onClose={() => setError('')} />}
      {success && <Toast type="success" message={success} onClose={() => setSuccess('')} />}

      {/* Scenario Selection Box */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <div>
          <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block mb-3">
            Choose What-If Scenario to Simulate:
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setScenarioType('EXCLUDE_TRUCK')}
              className={`p-4 rounded-xl border text-left transition cursor-pointer ${
                scenarioType === 'EXCLUDE_TRUCK'
                  ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/20'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                <Truck className="w-4 h-4 text-blue-600" />
                <span>Scenario A: Truck Breakdown</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Temporarily removes an active vehicle from service to test if fleet can absorb its cargo load.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setScenarioType('URGENT_PACKAGE')}
              className={`p-4 rounded-xl border text-left transition cursor-pointer ${
                scenarioType === 'URGENT_PACKAGE'
                  ? 'border-purple-600 bg-purple-50/50 ring-2 ring-purple-600/20'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                <Package className="w-4 h-4 text-purple-600" />
                <span>Scenario B: Urgent Package Arrival</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Injects an emergency high-priority consignment to test placement feasibility and displacement.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setScenarioType('REDUCE_CAPACITY')}
              className={`p-4 rounded-xl border text-left transition cursor-pointer ${
                scenarioType === 'REDUCE_CAPACITY'
                  ? 'border-amber-600 bg-amber-50/50 ring-2 ring-amber-600/20'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                <SlidersHorizontal className="w-4 h-4 text-amber-600" />
                <span>Scenario C: Reduced Truck Capacity</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Reduces a vehicle&apos;s available capacity (e.g. 50% maintenance or partial load constraint).
              </p>
            </button>
          </div>
        </div>

        {/* Dynamic Scenario Controls */}
        <div className="pt-4 border-t border-slate-100">
          {scenarioType === 'EXCLUDE_TRUCK' && (
            <div className="max-w-md space-y-2">
              <label className="text-xs font-semibold text-slate-700">Select Vehicle to Exclude (Breakdown):</label>
              <select
                value={selectedTruckId}
                onChange={(e) => setSelectedTruckId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                {trucks.map((t) => (
                  <option key={t.truck_id} value={t.truck_id}>
                    {t.truck_number} ({t.truck_model}) &bull; {t.max_weight_kg}kg / {t.max_volume_m3}m³
                  </option>
                ))}
              </select>
            </div>
          )}

          {scenarioType === 'URGENT_PACKAGE' && (
            <div className="space-y-3">
              <span className="text-xs font-semibold text-slate-700 block">Proposed Urgent Consignment Details:</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-[11px] text-slate-500 block mb-1">Description</label>
                  <input
                    type="text"
                    value={proposedPackage.description}
                    onChange={(e) => setProposedPackage({ ...proposedPackage, description: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 block mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    value={proposedPackage.weight_kg}
                    onChange={(e) => setProposedPackage({ ...proposedPackage, weight_kg: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 block mb-1">Destination</label>
                  <input
                    type="text"
                    value={proposedPackage.destination}
                    onChange={(e) => setProposedPackage({ ...proposedPackage, destination: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>
            </div>
          )}

          {scenarioType === 'REDUCE_CAPACITY' && (
            <div className="max-w-md space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Select Target Vehicle:</label>
                <select
                  value={selectedTruckId}
                  onChange={(e) => setSelectedTruckId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                >
                  {trucks.map((t) => (
                    <option key={t.truck_id} value={t.truck_id}>
                      {t.truck_number} ({t.truck_model})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-slate-700">Capacity Reduction Percentage:</span>
                  <span className="font-bold text-amber-600">{capacityReductionPct}% Reduced</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="90"
                  step="5"
                  value={capacityReductionPct}
                  onChange={(e) => setCapacityReductionPct(e.target.value)}
                  className="w-full accent-amber-600 cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Simulation Comparison Results */}
      {simResult && (
        <div className="space-y-6">
          {/* Impact Narrative Banner */}
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl flex items-start gap-3">
            <FlaskConical className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-purple-900">Simulation Impact Evaluation</h4>
              <p className="text-sm font-semibold text-purple-950 mt-1">{simResult.impact_summary}</p>
            </div>
          </div>

          {/* Delta Comparison Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 font-semibold uppercase">Assigned Packages</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl font-bold text-slate-900">{simResult.simulated_summary.assigned_packages}</span>
                <span
                  className={`text-xs font-bold ${
                    simResult.delta.assigned_change >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {simResult.delta.assigned_change >= 0 ? `+${simResult.delta.assigned_change}` : simResult.delta.assigned_change}
                </span>
              </div>
              <span className="text-[10px] text-slate-400">vs original ({simResult.original_summary.assigned_packages})</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 font-semibold uppercase">Unassigned Packages</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl font-bold text-slate-900">{simResult.simulated_summary.unassigned_packages}</span>
                <span
                  className={`text-xs font-bold ${
                    simResult.delta.unassigned_change <= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {simResult.delta.unassigned_change >= 0 ? `+${simResult.delta.unassigned_change}` : simResult.delta.unassigned_change}
                </span>
              </div>
              <span className="text-[10px] text-slate-400">vs original ({simResult.original_summary.unassigned_packages})</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 font-semibold uppercase">Fleet Weight Util</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl font-bold text-blue-600">
                  {simResult.simulated_summary.overall_weight_utilization_pct}%
                </span>
                <span
                  className={`text-xs font-bold ${
                    simResult.delta.weight_util_change_pct >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {simResult.delta.weight_util_change_pct >= 0 ? `+${simResult.delta.weight_util_change_pct}%` : `${simResult.delta.weight_util_change_pct}%`}
                </span>
              </div>
              <span className="text-[10px] text-slate-400">vs original ({simResult.original_summary.overall_weight_utilization_pct}%)</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 font-semibold uppercase">Fleet Volume Util</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl font-bold text-purple-600">
                  {simResult.simulated_summary.overall_volume_utilization_pct}%
                </span>
                <span
                  className={`text-xs font-bold ${
                    simResult.delta.volume_util_change_pct >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {simResult.delta.volume_util_change_pct >= 0 ? `+${simResult.delta.volume_util_change_pct}%` : `${simResult.delta.volume_util_change_pct}%`}
                </span>
              </div>
              <span className="text-[10px] text-slate-400">vs original ({simResult.original_summary.overall_volume_utilization_pct}%)</span>
            </div>
          </div>

          {/* Newly Unassigned Warning (if any) */}
          {simResult.newly_unassigned_packages?.length > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
              <div className="flex items-center gap-2 font-bold text-amber-900 text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Cargo Displaced by Simulation:</span>
              </div>
              <p className="text-xs text-amber-800">
                The following packages could no longer fit in the active fleet under this scenario:
              </p>
              <ul className="list-disc list-inside text-xs text-amber-900 font-medium pt-1">
                {simResult.newly_unassigned_packages.map((name, i) => (
                  <li key={i}>{name}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Revised Fleet Allocation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {simResult.simulated_result.trucks.map((t) => (
              <div key={t.truck_id} className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">{t.truck_number}</span>
                  <span className="text-slate-500 font-medium">{t.assigned_packages.length} assigned</span>
                </div>
                <ProgressBar
                  percentage={t.weight_utilization_pct}
                  label="Weight"
                  current={t.total_assigned_weight_kg}
                  max={t.max_weight_kg}
                  unit="kg"
                  height="h-1.5"
                />
                <ProgressBar
                  percentage={t.volume_utilization_pct}
                  label="Volume"
                  current={t.total_assigned_volume_m3}
                  max={t.max_volume_m3}
                  unit="m³"
                  height="h-1.5"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
