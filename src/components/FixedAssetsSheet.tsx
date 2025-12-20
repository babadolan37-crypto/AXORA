import React, { useState } from 'react';
import { useAssetData } from '../hooks/useAssetData';
import { Plus, Trash2, Box, TrendingDown, DollarSign, Calendar } from 'lucide-react';
import { FixedAsset } from '../types';

export function FixedAssetsSheet() {
  const { assets, loading, error, addAsset, deleteAsset } = useAssetData();
  const [showForm, setShowForm] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState<Partial<FixedAsset>>({
    name: '',
    category: 'Elektronik',
    purchase_date: new Date().toISOString().split('T')[0],
    purchase_cost: 0,
    residual_value: 0,
    useful_life_years: 4, // Default umum elektronik
    depreciation_method: 'straight_line',
    status: 'active',
    notes: ''
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.purchase_cost) return;

    await addAsset(formData as any);
    setShowForm(false);
    // Reset form
    setFormData({
      name: '',
      category: 'Elektronik',
      purchase_date: new Date().toISOString().split('T')[0],
      purchase_cost: 0,
      residual_value: 0,
      useful_life_years: 4,
      depreciation_method: 'straight_line',
      status: 'active',
      notes: ''
    });
  };

  // Hitung total aset
  const totalAssetValue = assets.reduce((sum, asset) => sum + (asset.current_value || 0), 0);
  const totalDepreciation = assets.reduce((sum, asset) => sum + (asset.accumulated_depreciation || 0), 0);

  if (loading) {
    return <div className="p-8 text-center">Loading Assets...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Manajemen Aset Tetap</h2>
          <p className="text-gray-500">Kelola inventaris dan penyusutan otomatis</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus size={20} />
          Tambah Aset
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
              <Box size={20} />
            </div>
            <h3 className="font-semibold text-gray-700">Total Aset</h3>
          </div>
          <p className="text-2xl font-bold">{assets.length} Item</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg text-green-600">
              <DollarSign size={20} />
            </div>
            <h3 className="font-semibold text-gray-700">Nilai Buku Total</h3>
          </div>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totalAssetValue)}</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
              <TrendingDown size={20} />
            </div>
            <h3 className="font-semibold text-gray-700">Akumulasi Penyusutan</h3>
          </div>
          <p className="text-2xl font-bold text-orange-600">{formatCurrency(totalDepreciation)}</p>
        </div>
      </div>

      {/* Form Tambah Aset */}
      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Input Aset Baru</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Aset</label>
              <input
                type="text"
                required
                className="w-full border rounded-lg p-2"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Contoh: MacBook Pro M1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
              <select
                className="w-full border rounded-lg p-2"
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value as any })}
              >
                <option value="Elektronik">Elektronik</option>
                <option value="Kendaraan">Kendaraan</option>
                <option value="Mesin">Mesin</option>
                <option value="Furniture">Furniture</option>
                <option value="Bangunan">Bangunan</option>
                <option value="Tanah">Tanah</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Beli</label>
              <input
                type="date"
                required
                className="w-full border rounded-lg p-2"
                value={formData.purchase_date}
                onChange={e => setFormData({ ...formData, purchase_date: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Harga Perolehan (Rp)</label>
              <input
                type="number"
                required
                min="0"
                className="w-full border rounded-lg p-2"
                value={formData.purchase_cost}
                onChange={e => setFormData({ ...formData, purchase_cost: Number(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Umur Ekonomis (Tahun)</label>
              <input
                type="number"
                required
                min="1"
                className="w-full border rounded-lg p-2"
                value={formData.useful_life_years}
                onChange={e => setFormData({ ...formData, useful_life_years: Number(e.target.value) })}
              />
              <p className="text-xs text-gray-500 mt-1">Elektronik: 4 thn, Kendaraan: 8 thn, Bangunan: 20 thn</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nilai Sisa (Residu)</label>
              <input
                type="number"
                min="0"
                className="w-full border rounded-lg p-2"
                value={formData.residual_value}
                onChange={e => setFormData({ ...formData, residual_value: Number(e.target.value) })}
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium"
              >
                Simpan Aset
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Asset Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Aset</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tgl Beli</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Harga Beli</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Penyusutan/Bulan</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Nilai Buku Saat Ini</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {assets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Belum ada data aset. Silakan tambah aset baru.
                  </td>
                </tr>
              ) : (
                assets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{asset.name}</div>
                      <div className="text-xs text-gray-500">{asset.category} • {asset.useful_life_years} Tahun</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(asset.purchase_date).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                      {formatCurrency(asset.purchase_cost)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-orange-600">
                      {formatCurrency(asset.monthly_depreciation || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-green-600">
                      {formatCurrency(asset.current_value || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => deleteAsset(asset.id)}
                        className="text-red-600 hover:text-red-900 p-1"
                        title="Hapus Aset"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
