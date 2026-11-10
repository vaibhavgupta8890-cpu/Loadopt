import React, { useState } from 'react';
import {
  Search,
  Truck,
  Package,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Compass,
  Scale,
  Box,
  Layers,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import { api } from '../services/api';
import { Toast } from '../components/common/Toast';

export const TrackingPortal = () => {
  const [query, setQuery] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (searchQuery) => {
    const q = (searchQuery || query).trim();
    if (!q) return;

    setLoading(true);
    setError('');
    setData(null);
    try {
      const res = await api.trackShipmentOrTruck(q);
      setData(res);
    } catch (err) {
      setError(err.message || 'Tracking information not found.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSearch();
  };

  const handleQuickChip = (val) => {
    setQuery(val);
    handleSearch(val);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Search Header Card */}
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center">
        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xs">
          <Search className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Delivery & Vehicle Status Tracking</h2>
        <p className="text-xs text-slate-500 max-w-lg mx-auto mt-1 mb-6">
          Enter your assigned Package Number (e.g. 1, 2) or Truck Registration Code (e.g. TRK-101) to view real-time delivery status, vehicle allocation, and route sequence.
        </p>

        {/* Input Bar */}
        <form onSubmit={handleFormSubmit} className="max-w-xl mx-auto relative flex items-center">
          <input
            type="text"
            required
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter Packet # (e.g. 1) or Truck # (e.g. TRK-101)..."
            className="w-full pl-4 pr-32 py-3.5 text-sm rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-slate-900 shadow-xs placeholder:text-slate-400"
          />
          <button
            type="submit"
            disabled={loading}
            className="absolute right-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>Track</span>
          </button>
        </form>

        {/* Quick Example Chips */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="text-slate-400 text-[11px]">Quick Try:</span>
          {['1', '2', '3', 'TRK-101', 'TRK-102'].map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => handleQuickChip(chip)}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[11px] font-semibold transition cursor-pointer"
            >
              {chip.startsWith('TRK') ? chip : `#${chip}`}
            </button>
          ))}
        </div>
      </div>

      {/* Error Banner */}
      {error && <Toast type="error" message={error} onClose={() => setError('')} />}

      {/* RESULTS DISPLAY */}
      {data && data.type === 'PACKAGE' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-6 p-6">
          {/* Header Status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Consignment Tracking &bull; #{data.package.package_id}
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">{data.package.description}</h3>
            </div>

            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider self-start sm:self-auto ${
                data.package.status === 'ASSIGNED'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : data.package.status === 'DELIVERED'
                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              Status: {data.package.status}
            </span>
          </div>

          {/* Delivery Timeline Sequence */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 py-2">
            <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-emerald-700 uppercase">Stage 1</span>
              <p className="text-xs font-bold text-slate-900 mt-1">Order Received</p>
              <span className="text-[10px] text-slate-500 mt-1">Logged in system</span>
            </div>

            <div
              className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                data.truck ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-200 bg-slate-50'
              }`}
            >
              <span className="text-[10px] font-bold text-blue-700 uppercase">Stage 2</span>
              <p className="text-xs font-bold text-slate-900 mt-1">
                {data.truck ? `Assigned to ${data.truck.truck_number}` : 'Awaiting Assignment'}
              </p>
              <span className="text-[10px] text-slate-500 mt-1">
                {data.truck ? `Load Order #${data.delivery?.loading_order || 1}` : 'Pending allocation'}
              </span>
            </div>

            <div
              className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                data.truck ? 'border-blue-200 bg-blue-50/50' : 'border-slate-200 bg-slate-50'
              }`}
            >
              <span className="text-[10px] font-bold text-purple-700 uppercase">Stage 3</span>
              <p className="text-xs font-bold text-slate-900 mt-1">
                {data.truck ? `Scheduled Stop #${data.delivery?.stop_number || 1}` : 'Route Pending'}
              </p>
              <span className="text-[10px] text-slate-500 mt-1">
                {data.delivery ? `~${data.delivery.estimated_distance_km} km transit` : 'En route to hub'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Stage 4</span>
              <p className="text-xs font-bold text-slate-900 mt-1">Final Destination</p>
              <span className="text-[10px] text-slate-500 mt-1 truncate">{data.package.destination}</span>
            </div>
          </div>

          {/* Assigned Truck & Transit Details */}
          {data.truck ? (
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assigned Vehicle</span>
                <div className="mt-2 flex items-center gap-3">
                  <div className="p-2.5 bg-blue-600 text-white rounded-xl">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{data.truck.truck_number}</h4>
                    <p className="text-xs text-slate-500">{data.truck.truck_model}</p>
                  </div>
                </div>
                <div className="mt-3 text-xs text-slate-600 space-y-1">
                  <p>
                    <strong>Origin Depot:</strong> {data.truck.starting_location}
                  </p>
                  <p>
                    <strong>Vehicle Status:</strong>{' '}
                    <span className="text-emerald-700 font-semibold">{data.truck.status}</span>
                  </p>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Delivery Details</span>
                <div className="mt-2 space-y-2 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>
                      <strong>Destination:</strong> {data.package.destination}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>
                      <strong>Cargo Weight:</strong> {data.package.weight_kg} kg
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Box className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>
                      <strong>Volume:</strong> {data.package.volume_m3.toFixed(3)} m³
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>
                      <strong>Priority Tier:</strong> {data.package.priority}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>This package is currently PENDING in the warehouse inventory and has not yet been dispatched to an active truck.</span>
            </div>
          )}
        </div>
      )}

      {/* RESULTS DISPLAY: TRUCK SEARCH */}
      {data && data.type === 'TRUCK' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-6 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Fleet Vehicle Status &bull; {data.truck.truck_number}
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">{data.truck.truck_model}</h3>
            </div>

            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider self-start sm:self-auto ${
                data.truck.status === 'AVAILABLE'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              Vehicle: {data.truck.status}
            </span>
          </div>

          {/* Route Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Route Origin</span>
              <p className="text-xs font-bold text-slate-900 mt-1 truncate">{data.route.source}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Total Distance</span>
              <p className="text-xs font-bold text-blue-600 mt-1">{data.route.total_distance_km} km</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Assigned Packages</span>
              <p className="text-xs font-bold text-emerald-600 mt-1">{data.truck.total_assigned_packages} items</p>
            </div>
          </div>

          {/* Delivery Stops */}
          {data.route.stops?.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Delivery Stops Sequence</h4>
              <div className="flex flex-wrap items-center gap-2">
                {data.route.stops.map((stop, i) => (
                  <React.Fragment key={stop.destination}>
                    <span className="px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-xs font-medium flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                        {stop.stop_number}
                      </span>
                      <span>{stop.destination}</span>
                    </span>
                    {i < data.route.stops.length - 1 && <span className="text-slate-400 text-xs">&rarr;</span>}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {/* Packages on Board */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
              Current Cargo Manifest ({data.manifest.length})
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Package ID</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3">Destination</th>
                    <th className="py-2.5 px-3">Weight</th>
                    <th className="py-2.5 px-3">Priority</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {data.manifest.map((p) => (
                    <tr key={p.package_id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold text-slate-900">#{p.package_id}</td>
                      <td className="py-2.5 px-3 text-slate-800">{p.description}</td>
                      <td className="py-2.5 px-3">{p.destination}</td>
                      <td className="py-2.5 px-3 font-mono">{p.weight_kg} kg</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                            p.priority === 'HIGH'
                              ? 'bg-rose-100 text-rose-700'
                              : p.priority === 'MEDIUM'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {p.priority}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-emerald-700 font-semibold">{p.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
