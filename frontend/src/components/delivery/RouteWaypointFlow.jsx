import React from 'react';
import { MapPin, Navigation, ArrowRight, CheckCircle2, Clock, Box, Building2, Flag } from 'lucide-react';

export const RouteWaypointFlow = ({ truck, onPrintManifest }) => {
  if (!truck) return null;

  const stops = truck.delivery_stops || [];
  const packages = truck.assigned_packages || [];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-6">
      {/* Route Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Navigation className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                Dispatch Sequence: {truck.truck_number}
              </h3>
              <p className="text-xs text-slate-500">
                Optimized via Nearest-Neighbor Haversine Heuristic &bull; {stops.length} Transit Stops
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onPrintManifest}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Flag className="w-3.5 h-3.5 text-blue-400" />
            <span>Export Dispatch Manifest</span>
          </button>
        </div>
      </div>

      {/* Interactive Transit Stepper Flow */}
      <div className="relative">
        {/* Origin / Starting Hub Card */}
        <div className="flex items-start gap-4">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold shadow-md shadow-slate-900/20 ring-4 ring-slate-100">
              <Building2 className="w-5 h-5 text-blue-400" />
            </div>
            <div className="w-0.5 h-16 bg-gradient-to-b from-slate-900 to-blue-500 my-1" />
          </div>

          <div className="flex-1 pb-4">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                  DEPARTURE DEPOT (ORIGIN)
                </span>
                <h4 className="text-sm font-extrabold text-slate-900">Central Logistics Hub, Delhi</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Starting coordinates: 28.6139° N, 77.2090° E &bull; Full payload loaded
                </p>
              </div>
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold">
                Trip Start &bull; 0.0 km
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Stops */}
        {stops.map((stop, index) => {
          const isLast = index === stops.length - 1;
          const stopPackages = packages.filter((p) => p.destination === stop.destination);

          return (
            <div key={stop.destination} className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black shadow-md shadow-blue-500/20 ring-4 ring-blue-50">
                  {stop.stop_number}
                </div>
                {!isLast && (
                  <div className="w-0.5 h-20 bg-gradient-to-b from-blue-500 to-blue-400 my-1" />
                )}
                {isLast && (
                  <div className="w-0.5 h-12 bg-dashed border-l-2 border-emerald-400 my-1" />
                )}
              </div>

              <div className="flex-1 pb-4">
                <div className="bg-white border border-slate-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-xs transition">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          STOP #{stop.stop_number}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700">
                          {stop.package_count} Parcels to Unload
                        </span>
                      </div>
                      <h4 className="text-base font-extrabold text-slate-900 mt-0.5">
                        {stop.destination}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Coordinates: {stop.latitude.toFixed(4)}° N, {stop.longitude.toFixed(4)}° E
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-xl font-mono text-xs font-bold">
                        <Navigation className="w-3.5 h-3.5" />
                        <span>+{stop.estimated_leg_distance_km ?? stop.distance_from_previous_km ?? 0} km</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Leg from previous waypoint
                      </div>
                    </div>
                  </div>

                  {/* Parcels dropped at this stop */}
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Cargo to be Discharged:
                    </span>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      {stopPackages.map((pkg) => (
                        <div
                          key={pkg.package_id}
                          className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-xs"
                        >
                          <Box className="w-3.5 h-3.5 text-slate-500" />
                          <span className="font-bold text-slate-800">#{pkg.package_id}</span>
                          <span className="text-slate-600 truncate max-w-[120px]">{pkg.description}</span>
                          <span className="text-slate-400 font-mono">({pkg.weight_kg}kg)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Final Completion Waypoint */}
        <div className="flex items-start gap-4">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-500/20 ring-4 ring-emerald-50">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
          </div>

          <div className="flex-1">
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                  MISSION COMPLETION
                </span>
                <h4 className="text-sm font-extrabold text-emerald-950">All Cargo Dispatched</h4>
                <p className="text-xs text-emerald-800 mt-0.5">
                  Total Journey Distance: <strong>{truck.total_route_distance_km} km</strong> &bull; Zero intermediate double-handling
                </p>
              </div>
              <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold">
                Route Closed
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
