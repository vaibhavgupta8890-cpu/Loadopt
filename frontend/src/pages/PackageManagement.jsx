import React, { useEffect, useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  MapPin,
  Scale,
  Box,
  Clock,
  AlertCircle,
  RefreshCw,
  Info,
  LayoutGrid,
  List,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/common/Modal';
import { Toast } from '../components/common/Toast';

export const PackageManagement = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [formData, setFormData] = useState({
    description: '',
    weight_kg: '',
    length_cm: '',
    width_cm: '',
    height_cm: '',
    destination: '',
    destination_latitude: '',
    destination_longitude: '',
    priority: 'MEDIUM',
    status: 'PENDING',
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { canModify } = useAuth();

  const DESTINATION_PRESETS = [
    { name: 'Delhi Hub', lat: 28.6500, lon: 77.2300 },
    { name: 'Gurgaon Sector 18', lat: 28.4900, lon: 77.0700 },
    { name: 'Noida Phase 2', lat: 28.5200, lon: 77.4100 },
    { name: 'Jaipur Industrial', lat: 26.9300, lon: 75.8200 },
    { name: 'Agra Logistics Park', lat: 27.2000, lon: 78.0200 },
    { name: 'Chandigarh Depot', lat: 30.7400, lon: 76.7900 },
  ];

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const data = await api.getPackages({
        search: search || undefined,
        priority: priorityFilter || undefined,
        status: statusFilter || undefined,
      });
      setPackages(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch packages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, [priorityFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchPackages();
  };

  // Live volume calculation
  const calculatedVolumeM3 = () => {
    const l = parseFloat(formData.length_cm) || 0;
    const w = parseFloat(formData.width_cm) || 0;
    const h = parseFloat(formData.height_cm) || 0;
    if (l > 0 && w > 0 && h > 0) {
      return ((l * w * h) / 1000000.0).toFixed(4);
    }
    return '0.0000';
  };

  const handlePresetSelect = (preset) => {
    setFormData({
      ...formData,
      destination: preset.name,
      destination_latitude: preset.lat,
      destination_longitude: preset.lon,
    });
  };

  const openCreateModal = () => {
    setEditingPackage(null);
    setFormData({
      description: '',
      weight_kg: '',
      length_cm: '',
      width_cm: '',
      height_cm: '',
      destination: '',
      destination_latitude: '',
      destination_longitude: '',
      priority: 'MEDIUM',
      status: 'PENDING',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (pkg) => {
    setEditingPackage(pkg);
    setFormData({
      description: pkg.description,
      weight_kg: pkg.weight_kg,
      length_cm: pkg.length_cm,
      width_cm: pkg.width_cm,
      height_cm: pkg.height_cm,
      destination: pkg.destination,
      destination_latitude: pkg.destination_latitude || '',
      destination_longitude: pkg.destination_longitude || '',
      priority: pkg.priority,
      status: pkg.status,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const weight = parseFloat(formData.weight_kg);
    const length = parseFloat(formData.length_cm);
    const width = parseFloat(formData.width_cm);
    const height = parseFloat(formData.height_cm);

    if (!formData.description.trim()) {
      setFormError('Package description is required.');
      return;
    }
    if (isNaN(weight) || weight <= 0) {
      setFormError('Weight must be a positive number.');
      return;
    }
    if (isNaN(length) || length <= 0 || isNaN(width) || width <= 0 || isNaN(height) || height <= 0) {
      setFormError('Dimensions (Length, Width, Height) must all be positive numbers in cm.');
      return;
    }
    if (!formData.destination.trim()) {
      setFormError('Destination is required.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        description: formData.description.trim(),
        weight_kg: weight,
        length_cm: length,
        width_cm: width,
        height_cm: height,
        destination: formData.destination.trim(),
        destination_latitude: formData.destination_latitude ? parseFloat(formData.destination_latitude) : null,
        destination_longitude: formData.destination_longitude ? parseFloat(formData.destination_longitude) : null,
        priority: formData.priority,
        status: formData.status,
      };

      if (editingPackage) {
        await api.updatePackage(editingPackage.package_id, payload);
        setSuccess(`Package #${editingPackage.package_id} updated successfully.`);
      } else {
        await api.createPackage(payload);
        setSuccess('New package created successfully.');
      }
      setIsModalOpen(false);
      fetchPackages();
    } catch (err) {
      setFormError(err.message || 'Failed to save package.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePackage = async (pkg) => {
    if (!window.confirm(`Are you sure you want to delete package #${pkg.package_id}?`)) {
      return;
    }
    try {
      await api.deletePackage(pkg.package_id);
      setSuccess(`Package #${pkg.package_id} deleted successfully.`);
      fetchPackages();
    } catch (err) {
      setError(err.message || 'Failed to delete package.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Package className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Package & Freight Inventory</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Register consignments, dimensions (L×W×H), physical weight, priority tiers, and destination waypoints.
              </p>
            </div>
          </div>
        </div>

        {canModify && (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Package</span>
          </button>
        )}
      </div>

      {/* Notifications */}
      {error && <Toast type="error" message={error} onClose={() => setError('')} />}
      {success && <Toast type="success" message={success} onClose={() => setSuccess('')} />}

      {/* Search, Filter & Layout Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search description or destination (e.g. Medical, Jaipur, Noida)..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
          />
        </form>

        {/* Priority Filter Chips */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold shrink-0">
            <button
              onClick={() => setPriorityFilter('')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                priorityFilter === '' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setPriorityFilter('HIGH')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                priorityFilter === 'HIGH' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              High
            </button>
            <button
              onClick={() => setPriorityFilter('MEDIUM')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                priorityFilter === 'MEDIUM' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Medium
            </button>
            <button
              onClick={() => setPriorityFilter('LOW')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                priorityFilter === 'LOW' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Low
            </button>
          </div>

          {/* Status Dropdown */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-xl text-xs text-slate-600 bg-slate-50 shrink-0">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer font-semibold"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="DELIVERED">Delivered</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'grid' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Grid Cards View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Table List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={fetchPackages}
            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition cursor-pointer shrink-0"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content: Grid View or Table View */}
      {loading ? (
        <div className="p-12 flex flex-col items-center justify-center gap-2 text-slate-500 bg-white rounded-2xl border border-slate-200">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-xs font-semibold">Fetching freight inventory records...</span>
        </div>
      ) : packages.length === 0 ? (
        <div className="p-12 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200">
          No cargo packages found matching current criteria.
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {packages.map((p) => (
            <div
              key={p.package_id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:border-blue-300 hover:shadow-md transition p-4 flex flex-col justify-between space-y-3"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-900 text-sm">#{p.package_id}</span>
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-extrabold border ${
                        p.priority === 'HIGH'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : p.priority === 'MEDIUM'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}
                    >
                      {p.priority}
                    </span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      p.status === 'ASSIGNED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : p.status === 'PENDING'
                        ? 'bg-slate-100 text-slate-700'
                        : 'bg-purple-50 text-purple-700'
                    }`}
                  >
                    {p.status}
                  </span>
                </div>

                {/* Description */}
                <h4 className="font-bold text-slate-800 text-xs mt-2 line-clamp-1" title={p.description}>
                  {p.description}
                </h4>

                {/* Cargo Specs */}
                <div className="grid grid-cols-2 gap-2 mt-2.5 bg-slate-50 p-2.5 rounded-xl text-xs border border-slate-100">
                  <div className="flex items-center gap-1.5 text-slate-700 font-mono">
                    <Scale className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>{p.weight_kg.toLocaleString()} kg</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700 font-mono">
                    <Box className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{p.volume_m3.toFixed(3)} m³</span>
                  </div>
                </div>

                {/* Dimensions */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 px-1">
                  <span>Size (L×W×H):</span>
                  <span className="font-mono text-slate-700 font-medium">
                    {p.length_cm} × {p.width_cm} × {p.height_cm} cm
                  </span>
                </div>

                {/* Destination */}
                <div className="flex items-center gap-1 text-[11px] text-slate-600 mt-1.5 px-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-semibold truncate">{p.destination}</span>
                </div>
              </div>

              {/* Actions */}
              {canModify && (
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => openEditModal(p)}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-slate-700 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 rounded-lg text-xs font-semibold transition cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeletePackage(p)}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg text-xs font-semibold transition cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">ID</th>
                  <th className="py-3.5 px-4">Description</th>
                  <th className="py-3.5 px-4">Weight</th>
                  <th className="py-3.5 px-4">Dimensions (L×W×H)</th>
                  <th className="py-3.5 px-4">Volume</th>
                  <th className="py-3.5 px-4">Destination</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Status</th>
                  {canModify && <th className="py-3.5 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {packages.map((p) => (
                  <tr key={p.package_id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">#{p.package_id}</td>
                    <td className="py-3.5 px-4 text-slate-800 font-semibold max-w-[220px] truncate" title={p.description}>
                      {p.description}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      <div className="flex items-center gap-1">
                        <Scale className="w-3.5 h-3.5 text-slate-400" />
                        <span>{p.weight_kg.toLocaleString()} kg</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                      {p.length_cm} × {p.width_cm} × {p.height_cm} cm
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-semibold">
                      <div className="flex items-center gap-1">
                        <Box className="w-3.5 h-3.5 text-slate-400" />
                        <span>{p.volume_m3.toFixed(3)} m³</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{p.destination}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.priority === 'HIGH'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : p.priority === 'MEDIUM'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {p.priority}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.status === 'ASSIGNED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : p.status === 'PENDING'
                            ? 'bg-slate-100 text-slate-700 border border-slate-200'
                            : p.status === 'DELIVERED'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    {canModify && (
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                            title="Edit Package"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeletePackage(p)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Delete Package"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Package Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPackage ? `Edit Package #${editingPackage.package_id}` : 'Register New Cargo Package'}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 font-medium">
              {formError}
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Package Description *</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g. Critical Medical Equipment, Oxygen Concentrators"
              required
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Gross Weight (kg) *</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={formData.weight_kg}
                onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
                placeholder="e.g. 150"
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Priority Classification</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 font-semibold cursor-pointer"
              >
                <option value="HIGH">High (Urgent / Medical)</option>
                <option value="MEDIUM">Medium (Standard Business)</option>
                <option value="LOW">Low (Bulk / Non-urgent)</option>
              </select>
            </div>
          </div>

          {/* Dimensions 3D */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">Physical Dimensions (cm)</span>
              <span className="text-[11px] text-blue-600 font-mono font-semibold">
                Auto-calculated Volume: {calculatedVolumeM3()} m³
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] text-slate-500 mb-0.5">Length (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  value={formData.length_cm}
                  onChange={(e) => setFormData({ ...formData, length_cm: e.target.value })}
                  placeholder="e.g. 60"
                  required
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-0.5">Width (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  value={formData.width_cm}
                  onChange={(e) => setFormData({ ...formData, width_cm: e.target.value })}
                  placeholder="e.g. 40"
                  required
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-0.5">Height (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  value={formData.height_cm}
                  onChange={(e) => setFormData({ ...formData, height_cm: e.target.value })}
                  placeholder="e.g. 30"
                  required
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono text-xs"
                />
              </div>
            </div>
          </div>

          {/* Destination with Quick Presets */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Destination *</label>
            <input
              type="text"
              value={formData.destination}
              onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
              placeholder="e.g. Gurgaon Sector 18"
              required
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-[10px] text-slate-400 self-center">Presets:</span>
              {DESTINATION_PRESETS.map((dp) => (
                <button
                  type="button"
                  key={dp.name}
                  onClick={() => handlePresetSelect(dp)}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 rounded text-[10px] font-medium transition cursor-pointer text-slate-600"
                >
                  {dp.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Saving...' : editingPackage ? 'Update Package' : 'Register Package'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
