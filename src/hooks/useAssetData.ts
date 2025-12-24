import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { FixedAsset } from '../types';

export function useAssetData() {
  const [assets, setAssets] = useState<FixedAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAssets();
  }, []);

  async function fetchAssets() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('fixed_assets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calculate depreciation for each asset
      const assetsWithCalculations = (data || []).map((asset: FixedAsset) => {
        const calculations = calculateDepreciation(asset);
        return { ...asset, ...calculations };
      });

      setAssets(assetsWithCalculations);
    } catch (err: any) {
      console.error('Error fetching assets:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Helper: Hitung Penyusutan (Metode Garis Lurus)
  function calculateDepreciation(asset: FixedAsset) {
    // Rumus Garis Lurus: (Harga Perolehan - Nilai Sisa) / Umur Ekonomis
    const depreciableAmount = asset.purchase_cost - asset.residual_value;
    const annualDepreciation = depreciableAmount / asset.useful_life_years;
    const monthlyDepreciation = annualDepreciation / 12;

    // Hitung akumulasi penyusutan berdasarkan tanggal beli s.d. sekarang
    const purchaseDate = new Date(asset.purchase_date);
    const today = new Date();
    
    // Selisih bulan
    const monthsDiff = (today.getFullYear() - purchaseDate.getFullYear()) * 12 + (today.getMonth() - purchaseDate.getMonth());
    const validMonths = Math.max(0, monthsDiff); // Tidak boleh negatif

    let accumulatedDepreciation = validMonths * monthlyDepreciation;
    
    // Cap akumulasi tidak boleh melebihi depreciable amount
    if (accumulatedDepreciation > depreciableAmount) {
      accumulatedDepreciation = depreciableAmount;
    }

    const currentValue = asset.purchase_cost - accumulatedDepreciation;

    return {
      monthly_depreciation: monthlyDepreciation,
      accumulated_depreciation: accumulatedDepreciation,
      current_value: currentValue
    };
  }

  async function addAsset(asset: Omit<FixedAsset, 'id' | 'created_at' | 'updated_at' | 'user_id'>) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not logged in');

      const { data, error } = await supabase
        .from('fixed_assets')
        .insert({
          ...asset,
          user_id: user.id
        })
        .select()
        .maybeSingle();

      if (error) throw error;

      const newAsset = { ...data, ...calculateDepreciation(data) };
      setAssets([newAsset, ...assets]);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  async function deleteAsset(id: string) {
    try {
      const { error } = await supabase
        .from('fixed_assets')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setAssets(assets.filter(a => a.id !== id));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  return {
    assets,
    loading,
    error,
    addAsset,
    deleteAsset,
    refresh: fetchAssets
  };
}
