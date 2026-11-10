import React, { useEffect, useState } from 'react';
import {
  Truck,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  MapPin,
  Scale,
  Box,
  LayoutGrid,
  List,
  Navigation,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/common/Modal';
import { Toast } from '../components/common/Toast';
import { ProgressBar } from '../components/common/ProgressBar';

export const TruckManagement = () => {
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTruck, setEditingTruck] = useState(null);
  const [formData, setFormData] = useState({
    truck_number: '',
    truck_model: '',
    max_weight_kg: '',
    max_volume_m3: '',
    status: 'AVAILABLE',
    starting_location: 'Central Logistics Depot, Delhi',
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { canModify } = useAuth();

  const fetchTrucks = async () => {
    try {
      setLoading(true);
      const data = await api.getTrucks({
        search: search || undefined,
        status: statusFilter || undefined,
      });
      setTrucks(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch trucks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrucks();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTrucks();
  };

  const openCreateModal = () => {
    setEditingTruck(null);
    setFormData({
      truck_number: '',
      truck_model: '',
      max_weight_kg: '',
      max_volume_m3: '',
      status: 'AVAILABLE',
      starting_location: 'Central Logistics Depot, Delhi',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (truck) => {
    setEditingTruck(truck);
    setFormData({
      truck_number: truck.truck_number,
      truck_model: truck.truck_model,
      max_weight_kg: truck.max_weight_kg,
      max_volume_m3: truck.max_volume_m3,
      status: truck.status,
      starting_location: truck.starting_location,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const maxWeight = parseFloat(formData.max_weight_kg);
    const maxVolume = parseFloat(formData.max_volume_m3);

    if (!formData.truck_number.trim() || !formData.truck_model.trim()) {
      setFormError('Truck registration number and model are required.');
      return;
    }
    if (isNaN(maxWeight) || maxWeight <= 0) {
      setFormError('Maximum weight capacity must be a positive number.');
      return;
    }
    if (isNaN(maxVolume) || maxVolume <= 0) {
      setFormError('Maximum volume capacity must be a positive number.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingTruck) {
        await api.updateTruck(editingTruck.truck_id, {
          ...formData,
          max_weight_kg: maxWeight,
          max_volume_m3: maxVolume,
        });
        setSuccess(`Truck ${formData.truck_number} updated successfully.`);
      } else {
        await api.createTruck({
          ...formData,
          max_weight_kg: maxWeight,
          max_volume_m3: maxVolume,
        });
        setSuccess(`Truck ${formData.truck_number} created successfully.`);
      }
      setIsModalOpen(false);
      fetchTrucks();
    } catch (err) {
      setFormError(err.message || 'Failed to save truck.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTruck = async (truck) => {
    if (!window.confirm(`Are you sure you want to delete truck ${truck.truck_number}?`)) {
      return;
    }
    try {
      await api.deleteTruck(truck.truck_id);
      setSuccess(`Truck ${truck.truck_number} deleted successfully.`);
      fetchTrucks();
    } catch (err) {
      setError(err.message || 'Failed to delete truck.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Truck className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Fleet Vehicle Management</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure gross payload capacities, internal volume bounds, and dispatch telemetry.
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
            <span>Add Vehicle</span>
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
            placeholder="Search by registration (e.g. TRK-101) or model..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
          />
        </form>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold shrink-0">
            <button
              onClick={() => setStatusFilter('')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                statusFilter === '' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('AVAILABLE')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                statusFilter === 'AVAILABLE' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Available
            </button>
            <button
              onClick={() => setStatusFilter('IN_TRANSIT')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                statusFilter === 'IN_TRANSIT' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              In Transit
            </button>
            <button
              onClick={() => setStatusFilter('MAINTENANCE')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                statusFilter === 'MAINTENANCE' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Maintenance
            </button>
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
            onClick={fetchTrucks}
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
          <span className="text-xs font-semibold">Fetching fleet telemetry records...</span>
        </div>
      ) : trucks.length === 0 ? (
        <div className="p-12 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200">
          No vehicles found matching the specified filters.
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trucks.map((t) => (
            <div
              key={t.truck_id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:border-blue-300 hover:shadow-md transition p-5 flex flex-col justify-between space-y-4"
            >
              <div>
                {/* Card Top */}
                <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 text-base">{t.truck_number}</h3>
                      <p className="text-xs text-slate-500">{t.truck_model}</p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                      t.status === 'AVAILABLE'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : t.status === 'MAINTENANCE'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {t.status}
                  </span>
                </div>

                {/* Specs */}
                <div className="grid grid-cols-2 gap-2 my-3 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <Scale className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Max {t.max_weight_kg.toLocaleString()} kg</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <Box className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Max {t.max_volume_m3.toLocaleString()} m³</span>
                  </div>
                </div>

                {/* Progress Gauges */}
                <div className="space-y-2.5 pt-1">
                  <ProgressBar
                    percentage={t.weight_utilization_pct}
                    label="Weight Load"
                    current={t.total_assigned_weight_kg}
                    max={t.max_weight_kg}
                    unit="kg"
                    height="h-1.5"
                  />
                  <ProgressBar
                    percentage={t.volume_utilization_pct}
                    label="Volume Load"
                    current={t.total_assigned_volume_m3}
                    max={t.max_volume_m3}
                    unit="m³"
                    height="h-1.5"
                  />
                </div>

                {/* Base Depot */}
                <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-3 pt-2 border-t border-slate-100">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{t.starting_location}</span>
                </div>
              </div>

              {/* Action Buttons */}
              {canModify && (
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => openEditModal(t)}
                    className="flex items-center gap-1 px-3 py-1.5 text-slate-700 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 rounded-lg text-xs font-semibold transition cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteTruck(t)}
                    className="flex items-center gap-1 px-3 py-1.5 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg text-xs font-semibold transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
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
                  <th className="py-3.5 px-4">Vehicle Code</th>
                  <th className="py-3.5 px-4">Model & Make</th>
                  <th className="py-3.5 px-4">Payload Capacity</th>
                  <th className="py-3.5 px-4">Cargo Volume</th>
                  <th className="py-3.5 px-4">Active Utilization</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Base Depot</th>
                  {canModify && <th className="py-3.5 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {trucks.map((t) => (
                  <tr key={t.truck_id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{t.truck_number}</td>
                    <td className="py-3.5 px-4 text-slate-700">{t.truck_model}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Scale className="w-3.5 h-3.5 text-slate-400" />
                        <span>{t.max_weight_kg.toLocaleString()} kg</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Box className="w-3.5 h-3.5 text-slate-400" />
                        <span>{t.max_volume_m3.toLocaleString()} m³</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 min-w-[200px]">
                      <div className="space-y-1.5">
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
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          t.status === 'AVAILABLE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : t.status === 'MAINTENANCE'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[150px]">{t.starting_location}</span>
                      </div>
                    </td>
                    {canModify && (
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(t)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                            title="Edit Truck"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTruck(t)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Delete Truck"
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

      {/* Add / Edit Truck Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTruck ? `Edit Truck: ${editingTruck.truck_number}` : 'Register New Fleet Vehicle'}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 font-medium">
              {formError}
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Truck Registration / Code *</label>
            <input
              type="text"
              value={formData.truck_number}
              onChange={(e) => setFormData({ ...formData, truck_number: e.target.value.toUpperCase() })}
              placeholder="e.g. TRK-201"
              required
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono font-bold"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Make & Model *</label>
            <input
              type="text"
              value={formData.truck_model}
              onChange={(e) => setFormData({ ...formData, truck_model: e.target.value })}
              placeholder="e.g. Volvo FH16 Heavy Duty"
              required
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Max Payload Weight (kg) *</label>
              <input
                type="number"
                step="0.1"
                min="1"
                value={formData.max_weight_kg}
                onChange={(e) => setFormData({ ...formData, max_weight_kg: e.target.value })}
                placeholder="e.g. 5000"
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Max Internal Volume (m³) *</label>
              <input
                type="number"
                step="0.01"
                min="0.1"
                value={formData.max_volume_m3}
                onChange={(e) => setFormData({ ...formData, max_volume_m3: e.target.value })}
                placeholder="e.g. 24.5"
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Operational Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 font-semibold cursor-pointer"
              >
                <option value="AVAILABLE">Available</option>
                <option value="IN_TRANSIT">In Transit</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="OUT_OF_SERVICE">Out of Service</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Base Starting Location</label>
              <input
                type="text"
                value={formData.starting_location}
                onChange={(e) => setFormData({ ...formData, starting_location: e.target.value })}
                placeholder="e.g. Central Logistics Depot, Delhi"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
              />
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
              {submitting ? 'Saving...' : editingTruck ? 'Update Vehicle' : 'Register Vehicle'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
