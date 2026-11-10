import React from 'react';
import { X, Printer, Truck, FileText, CheckCircle2, ShieldCheck } from 'lucide-react';

export const DispatchManifestModal = ({ isOpen, onClose, truck }) => {
  if (!isOpen || !truck) return null;

  const packages = truck.assigned_packages || [];
  const stops = truck.delivery_stops || [];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-600 text-white rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Official Freight Dispatch Manifest</h3>
              <p className="text-xs text-slate-500">Trip & Cargo Chain of Custody Record</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Manifest</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Sheet Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-800 print:p-0">
          {/* Header Banner */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
            <div>
              <div className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-2">
                <span>LOADOPT FREIGHT LOGISTICS</span>
              </div>
              <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                MANIFEST REF: MAN-{truck.truck_id}-{new Date().toISOString().slice(0, 10).replace(/-/g, '')}
              </div>
              <div className="text-[11px] text-slate-500">Depot: Central Logistics Hub, Sector 62, Delhi NCR</div>
            </div>

            <div className="text-right">
              <div className="inline-block bg-slate-900 text-white font-bold px-3 py-1 rounded text-xs">
                OFFICIAL DISPATCH
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Date: {new Date().toLocaleDateString()}</div>
              <div className="text-[11px] text-slate-500">Time: {new Date().toLocaleTimeString()}</div>
            </div>
          </div>

          {/* Vehicle & Trip Specs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Truck Number</span>
              <div className="font-extrabold text-slate-900 text-sm">{truck.truck_number}</div>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Vehicle Model</span>
              <div className="font-bold text-slate-900">{truck.truck_model}</div>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Payload Weight</span>
              <div className="font-bold text-slate-900">
                {truck.total_assigned_weight_kg} / {truck.max_weight_kg} kg ({truck.weight_utilization_pct}%)
              </div>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Route Total Dist.</span>
              <div className="font-bold text-blue-600">{truck.total_route_distance_km} km</div>
            </div>
          </div>

          {/* Stop sequence overview */}
          <div>
            <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider mb-2">
              Planned Stop Sequence (Nearest-Neighbor Heuristic)
            </h4>
            <div className="flex flex-wrap gap-2">
              <span className="px-2.5 py-1 bg-slate-200 text-slate-800 rounded font-bold text-[11px]">
                Origin: Central Depot (0 km)
              </span>
              {stops.map((s) => (
                <span
                  key={s.destination}
                  className="px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded font-semibold text-[11px]"
                >
                  Stop #{s.stop_number}: {s.destination} (+{s.estimated_leg_distance_km ?? s.distance_from_previous_km ?? 0} km &bull; {s.package_count} pkgs)
                </span>
              ))}
            </div>
          </div>

          {/* Cargo Manifest Table */}
          <div>
            <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider mb-2">
              Cargo Line Items ({packages.length} Packages)
            </h4>
            <table className="w-full text-left border-collapse border border-slate-200 text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold">
                <tr>
                  <th className="border border-slate-200 p-2 text-center w-12">LIFO</th>
                  <th className="border border-slate-200 p-2">Pkg ID</th>
                  <th className="border border-slate-200 p-2">Description</th>
                  <th className="border border-slate-200 p-2">Destination</th>
                  <th className="border border-slate-200 p-2 text-right">Weight</th>
                  <th className="border border-slate-200 p-2 text-center">Priority</th>
                  <th className="border border-slate-200 p-2 w-28 text-center">Recipient Sign</th>
                </tr>
              </thead>
              <tbody>
                {packages.map((pkg) => (
                  <tr key={pkg.package_id} className="hover:bg-slate-50">
                    <td className="border border-slate-200 p-2 text-center font-bold font-mono">
                      #{pkg.loading_order}
                    </td>
                    <td className="border border-slate-200 p-2 font-mono font-semibold">#{pkg.package_id}</td>
                    <td className="border border-slate-200 p-2">{pkg.description}</td>
                    <td className="border border-slate-200 p-2 font-medium">{pkg.destination}</td>
                    <td className="border border-slate-200 p-2 text-right font-mono">{pkg.weight_kg} kg</td>
                    <td className="border border-slate-200 p-2 text-center">
                      <span className="font-bold text-[10px]">{pkg.priority}</span>
                    </td>
                    <td className="border border-slate-200 p-2 border-dashed"></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Signatures & Custody Verification */}
          <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-200 text-xs">
            <div>
              <div className="border-b border-slate-400 pb-8 mb-2"></div>
              <div className="font-bold text-slate-900">Dispatcher Signature & ID</div>
              <div className="text-slate-500 text-[10px]">LoadOpt Operations Desk &bull; Central Depot</div>
            </div>
            <div>
              <div className="border-b border-slate-400 pb-8 mb-2"></div>
              <div className="font-bold text-slate-900">Commercial Driver Signature & Date</div>
              <div className="text-slate-500 text-[10px]">Driver acknowledges weight & security verification</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
