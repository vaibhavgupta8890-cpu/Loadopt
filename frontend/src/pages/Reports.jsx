import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Truck,
  Package,
} from 'lucide-react';
import { api } from '../services/api';
import { Toast } from '../components/common/Toast';

export const Reports = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [activeTab, setActiveTab] = useState('trucks'); // 'trucks' | 'packages'

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.getReportsSummary();
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDownload = async (type) => {
    setDownloading(true);
    try {
      let blob;
      let filename = 'report.csv';
      if (type === 'trucks') {
        blob = await api.downloadTrucksCsv();
        filename = 'loadopt_trucks_utilization.csv';
      } else if (type === 'packages') {
        blob = await api.downloadPackagesCsv();
        filename = 'loadopt_packages_inventory.csv';
      } else if (type === 'assignments') {
        blob = await api.downloadAssignmentsCsv();
        filename = 'loadopt_active_assignments.csv';
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setSuccess(`Exported ${filename} successfully!`);
    } catch (err) {
      setError(err.message || 'CSV download failed.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Export Actions */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Reports & Data Analytics</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Audit-grade reporting metrics on vehicle payload efficiency, cargo fulfillment, and CSV export.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleDownload('trucks')}
            disabled={downloading}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Trucks CSV</span>
          </button>
          <button
            onClick={() => handleDownload('packages')}
            disabled={downloading}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Packages CSV</span>
          </button>
          <button
            onClick={() => handleDownload('assignments')}
            disabled={downloading}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer disabled:opacity-50"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Active Assignments CSV</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && <Toast type="error" message={error} onClose={() => setError('')} />}
      {success && <Toast type="success" message={success} onClose={() => setSuccess('')} />}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 font-semibold uppercase">Fleet Size</span>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{data?.truck_count ?? 0}</p>
          <span className="text-[11px] text-slate-400">Total trucks</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 font-semibold uppercase">Total Cargo Consignments</span>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{data?.package_count ?? 0}</p>
          <span className="text-[11px] text-slate-400">In database</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 font-semibold uppercase">Active Assignments</span>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">{data?.active_assignments_count ?? 0}</p>
          <span className="text-[11px] text-emerald-700 font-medium">Assigned to fleet</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 font-semibold uppercase">Avg Weight Util</span>
          <p className="text-2xl font-extrabold text-blue-600 mt-1">{data?.avg_weight_utilization ?? 0}%</p>
          <span className="text-[11px] text-slate-400">Across valid vehicles</span>
        </div>
      </div>

      {/* Report Tables Tabbed View */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="flex border-b border-slate-200 px-6 pt-4 text-xs font-semibold gap-4">
          <button
            onClick={() => setActiveTab('trucks')}
            className={`pb-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'trucks'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Vehicle Utilization Report ({data?.truck_records?.length || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab('packages')}
            className={`pb-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'packages'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Package Inventory Report ({data?.package_records?.length || 0})</span>
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
            Loading report records...
          </div>
        ) : activeTab === 'trucks' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Vehicle</th>
                  <th className="py-3 px-4">Model</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Assigned Weight</th>
                  <th className="py-3 px-4">Max Weight</th>
                  <th className="py-3 px-4">Weight Util %</th>
                  <th className="py-3 px-4">Assigned Volume</th>
                  <th className="py-3 px-4">Max Volume</th>
                  <th className="py-3 px-4">Volume Util %</th>
                  <th className="py-3 px-4">Packages</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {(data?.truck_records || []).map((t) => (
                  <tr key={t.truck_id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">{t.truck_number}</td>
                    <td className="py-3 px-4 text-slate-700">{t.model}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono">{t.assigned_weight_kg} kg</td>
                    <td className="py-3 px-4 font-mono">{t.max_weight_kg} kg</td>
                    <td className="py-3 px-4 font-bold text-blue-600">{t.weight_utilization_pct}%</td>
                    <td className="py-3 px-4 font-mono">{t.assigned_volume_m3} m³</td>
                    <td className="py-3 px-4 font-mono">{t.max_volume_m3} m³</td>
                    <td className="py-3 px-4 font-bold text-purple-600">{t.volume_utilization_pct}%</td>
                    <td className="py-3 px-4 font-bold">{t.assigned_packages}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Weight</th>
                  <th className="py-3 px-4">Volume</th>
                  <th className="py-3 px-4">Destination</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {(data?.package_records || []).map((p) => (
                  <tr key={p.package_id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">#{p.package_id}</td>
                    <td className="py-3 px-4 text-slate-800">{p.description}</td>
                    <td className="py-3 px-4 font-mono">{p.weight_kg} kg</td>
                    <td className="py-3 px-4 font-mono">{p.volume_m3.toFixed(3)} m³</td>
                    <td className="py-3 px-4">{p.destination}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {p.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700">
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
