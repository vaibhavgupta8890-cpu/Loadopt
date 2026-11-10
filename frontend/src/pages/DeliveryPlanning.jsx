import React, { useEffect, useState } from 'react';
import {
  Navigation,
  Truck,
  MapPin,
  Clock,
  Compass,
  ArrowRight,
  Info,
  RefreshCw,
  CheckCircle2,
  Printer,
  FileText,
  Building2,
  Flag,
} from 'lucide-react';
import { api } from '../services/api';
import { RouteWaypointFlow } from '../components/delivery/RouteWaypointFlow';
import { DispatchManifestModal } from '../components/delivery/DispatchManifestModal';

export const DeliveryPlanning = () => {
  const [trucks, setTrucks] = useState([]);
  const [selectedTruckId, setSelectedTruckId] = useState('');
  const [optResult, setOptResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isManifestOpen, setIsManifestOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const tList = await api.getTrucks();
        setTrucks(tList);
        if (tList.length > 0) {
          setSelectedTruckId(tList[0].truck_id);
        }

        // Fetch current optimization assignments & routes
        const opt = await api.runOptimization();
        setOptResult(opt);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const activeTruckLoad = optResult?.trucks?.find((t) => t.truck_id === parseInt(selectedTruckId));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Navigation className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Delivery Sequence & Route Dispatch</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Calculates multi-destination dispatch sequence starting from base depot using Nearest-Neighbor heuristic with Haversine distance.
              </p>
            </div>
          </div>
        </div>

        {/* Truck Selector */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-700">Select Vehicle:</label>
          <select
            value={selectedTruckId}
            onChange={(e) => setSelectedTruckId(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none font-bold text-slate-800 cursor-pointer shadow-xs"
          >
            {trucks.map((t) => (
              <option key={t.truck_id} value={t.truck_id}>
                {t.truck_number} ({t.truck_model})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Engineering Disclosure Note */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3 text-xs text-slate-600">
        <Info className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-800">Routing Distance Methodology:</span> Distance estimates are calculated mathematically using the <strong>Haversine Great-Circle formula</strong> between destination coordinates from the central logistics hub.
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 text-xs">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
          Computing route dispatch sequences...
        </div>
      ) : activeTruckLoad ? (
        <div className="space-y-6">
          {/* Route Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 font-semibold uppercase">Total Trip Distance</span>
              <p className="text-2xl font-black text-blue-600 mt-1">
                {activeTruckLoad.total_route_distance_km} km
              </p>
              <span className="text-[11px] text-slate-400">Haversine sphere calc</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 font-semibold uppercase">Delivery Stops</span>
              <p className="text-2xl font-black text-slate-900 mt-1">
                {activeTruckLoad.delivery_stops.length} Stops
              </p>
              <span className="text-[11px] text-slate-400">Waypoints visited</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 font-semibold uppercase">Assigned Consignments</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">
                {activeTruckLoad.assigned_packages.length}
              </p>
              <span className="text-[11px] text-slate-400">Packages on board</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 font-semibold uppercase">Estimated Transit Time</span>
              <p className="text-2xl font-black text-purple-600 mt-1">
                {(activeTruckLoad.total_route_distance_km / 50.0 + activeTruckLoad.delivery_stops.length * 0.5).toFixed(1)} hrs
              </p>
              <span className="text-[11px] text-slate-400">@ 50 km/h + 30m unload</span>
            </div>
          </div>

          {/* Visual Route Transit Stepper Flow */}
          <RouteWaypointFlow
            truck={activeTruckLoad}
            onPrintManifest={() => setIsManifestOpen(true)}
          />

          {/* Delivery Manifest Table */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Stop-by-Stop Delivery Sequence Manifest
              </h3>
              <button
                onClick={() => setIsManifestOpen(true)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official Manifest</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Sequence</th>
                    <th className="py-2.5 px-3">Destination</th>
                    <th className="py-2.5 px-3">Leg Distance</th>
                    <th className="py-2.5 px-3">Consignments</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {activeTruckLoad.delivery_stops.map((stop) => (
                    <tr key={stop.destination} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold text-slate-900">Stop #{stop.stop_number}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{stop.destination}</td>
                      <td className="py-2.5 px-3 font-mono">
                        {stop.estimated_leg_distance_km ?? stop.distance_from_previous_km ?? 0} km
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">{stop.package_count} packages</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          Scheduled
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200">
          No active routing assignments found for this vehicle. Run optimization to generate a delivery dispatch plan.
        </div>
      )}

      {/* Official Dispatch Manifest Modal */}
      <DispatchManifestModal
        isOpen={isManifestOpen}
        onClose={() => setIsManifestOpen(false)}
        truck={activeTruckLoad}
      />
    </div>
  );
};
