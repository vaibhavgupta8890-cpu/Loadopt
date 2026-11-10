import React, { useState } from 'react';
import { Box, Truck, ShieldCheck, Scale, Layers, ChevronRight, Info } from 'lucide-react';

export const CargoBayVisualizer = ({ truck }) => {
  const [hoveredPkg, setHoveredPkg] = useState(null);

  if (!truck) return null;

  const packages = truck.assigned_packages || [];
  const weightPct = Math.min(Math.round(truck.weight_utilization_pct || 0), 100);
  const volumePct = Math.min(Math.round(truck.volume_utilization_pct || 0), 100);

  // Helper for priority color theme
  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'HIGH':
        return {
          bg: 'bg-rose-500 hover:bg-rose-600',
          border: 'border-rose-400',
          text: 'text-white',
          badge: 'bg-rose-100 text-rose-800 border-rose-200',
        };
      case 'MEDIUM':
        return {
          bg: 'bg-amber-500 hover:bg-amber-600',
          border: 'border-amber-400',
          text: 'text-white',
          badge: 'bg-amber-100 text-amber-800 border-amber-200',
        };
      default:
        return {
          bg: 'bg-blue-500 hover:bg-blue-600',
          border: 'border-blue-400',
          text: 'text-white',
          badge: 'bg-blue-100 text-blue-800 border-blue-200',
        };
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden transition-all">
      {/* Visualizer Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 text-base">{truck.truck_number}</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                {packages.length} Parcels Assigned
              </span>
            </div>
            <p className="text-xs text-slate-500">{truck.truck_model}</p>
          </div>
        </div>

        {/* Capacity Gauges */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
            <Scale className="w-4 h-4 text-blue-600" />
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500">Weight Load</div>
              <div className="font-bold text-slate-900">
                {truck.total_assigned_weight_kg} / {truck.max_weight_kg} kg{' '}
                <span className={`text-[11px] font-bold ${weightPct > 90 ? 'text-amber-600' : 'text-blue-600'}`}>
                  ({weightPct}%)
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
            <Layers className="w-4 h-4 text-emerald-600" />
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500">Volume Load</div>
              <div className="font-bold text-slate-900">
                {truck.total_assigned_volume_m3} / {truck.max_volume_m3} m³{' '}
                <span className={`text-[11px] font-bold ${volumePct > 90 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  ({volumePct}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2D Cargo Trailer Bed Simulation */}
      <div className="p-5 bg-slate-50/70 border-b border-slate-200/80">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
          <span className="flex items-center gap-1 font-semibold text-slate-700">
            <Layers className="w-3.5 h-3.5 text-blue-600" /> 2D Trailer Bed Cargo Schematic (Top-Down View)
          </span>
          <span className="text-[11px] text-slate-400">
            Hover over cargo parcels to inspect weight & routing metadata
          </span>
        </div>

        {/* Truck Trailer Container Wireframe */}
        <div className="relative bg-slate-900 rounded-2xl p-4 shadow-inner border-2 border-slate-800">
          {/* Truck Cabin at Left */}
          <div className="flex items-stretch gap-3 min-h-[140px]">
            {/* Cab Section */}
            <div className="w-16 rounded-xl bg-gradient-to-b from-blue-700 via-blue-800 to-slate-800 border border-blue-500/40 p-2 flex flex-col justify-between items-center text-center shadow-lg shrink-0">
              <span className="text-[10px] font-black tracking-widest text-blue-200 uppercase">CABIN</span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/30 border border-blue-300/40 flex items-center justify-center">
                <Truck className="w-5 h-5 text-blue-200" />
              </div>
              <span className="text-[9px] font-mono text-blue-300">FRONT</span>
            </div>

            {/* Cargo Hold Grid */}
            <div className="flex-1 bg-slate-950/80 rounded-xl border border-slate-800/80 p-3 relative overflow-hidden flex flex-col justify-between">
              {/* Internal grid line pattern */}
              <div
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                  backgroundImage:
                    'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
                  backgroundSize: '24px 24px',
                }}
              />

              {/* LIFO Loading Direction Banner */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-2 z-10 px-1 border-b border-slate-800 pb-1">
                <span className="flex items-center gap-1 text-blue-400 font-semibold">
                  <span>&larr; Front (Loaded First / Deep)</span>
                </span>
                <span className="text-slate-500 font-mono">
                  Payload Volume: {volumePct}% Filled &bull; {truck.total_assigned_volume_m3}m³
                </span>
                <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                  <span>Rear (Unloaded First / LIFO) &rarr;</span>
                </span>
              </div>

              {/* Dynamic Cargo Parcels Grid */}
              {packages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-xs text-slate-500 py-6">
                  Cargo bay empty. Run optimization to place packages.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 z-10 py-1">
                  {packages.map((pkg) => {
                    const style = getPriorityStyle(pkg.priority);
                    const isHovered = hoveredPkg?.package_id === pkg.package_id;
                    return (
                      <div
                        key={pkg.package_id}
                        onMouseEnter={() => setHoveredPkg(pkg)}
                        onMouseLeave={() => setHoveredPkg(null)}
                        className={`relative cursor-pointer transition-all duration-150 p-2 rounded-lg border flex flex-col justify-between min-h-[64px] shadow-sm select-none ${
                          style.bg
                        } ${style.border} ${isHovered ? 'scale-105 ring-2 ring-white z-20 shadow-lg' : ''}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-[11px] text-white tracking-tight">
                            #{pkg.package_id}
                          </span>
                          <span className="text-[9px] px-1 py-0.2 rounded font-black bg-black/30 text-white">
                            LIFO #{pkg.loading_order}
                          </span>
                        </div>
                        <div className="text-[10px] text-white/90 truncate font-medium mt-1">
                          {pkg.description}
                        </div>
                        <div className="flex items-center justify-between mt-1 text-[9px] font-mono text-white/80 border-t border-white/20 pt-1">
                          <span>{pkg.weight_kg}kg</span>
                          <span className="truncate max-w-[60px]">{pkg.destination}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Capacity Fill Bar at Bottom */}
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden mt-2 z-10">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(weightPct, volumePct)}%` }}
                />
              </div>
            </div>

            {/* Rear Roll-Up Door Section */}
            <div className="w-12 rounded-xl bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700 p-2 flex flex-col justify-between items-center text-center shadow-md shrink-0">
              <span className="text-[9px] font-bold text-slate-400 rotate-90 my-auto uppercase tracking-wider">
                DOOR
              </span>
              <span className="text-[9px] font-bold text-emerald-400 uppercase">REAR</span>
            </div>
          </div>
        </div>

        {/* Parcel Inspection Inspector (when hovered) */}
        {hoveredPkg ? (
          <div className="mt-3 p-3 bg-white rounded-xl border border-blue-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                <Box className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-900">
                  Package #{hoveredPkg.package_id}: {hoveredPkg.description}
                </span>
                <span className="text-slate-500 ml-2">
                  Dest: <strong className="text-slate-800">{hoveredPkg.destination}</strong>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                {hoveredPkg.weight_kg} kg &bull; {hoveredPkg.volume_m3} m³
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  getPriorityStyle(hoveredPkg.priority).badge
                }`}
              >
                {hoveredPkg.priority} Priority
              </span>
              <span className="bg-slate-900 text-white font-bold px-2 py-0.5 rounded text-[10px]">
                Loading Order #{hoveredPkg.loading_order}
              </span>
            </div>
          </div>
        ) : (
          <div className="mt-3 py-1.5 px-3 bg-white/60 rounded-xl border border-slate-200/60 text-[11px] text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-blue-500" />
              <span>
                <strong>LIFO Physics Rule:</strong> Parcels for earlier stops sit closest to the rear door so drivers unload without moving inner freight.
              </span>
            </span>
            <span className="font-mono text-slate-400 text-[10px]">Heuristic Weight Density Optimized</span>
          </div>
        )}
      </div>
    </div>
  );
};
