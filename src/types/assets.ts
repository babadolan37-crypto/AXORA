export type AssetCategory = 'Elektronik' | 'Kendaraan' | 'Mesin' | 'Furniture' | 'Bangunan' | 'Tanah' | 'Lainnya';
export type AssetStatus = 'active' | 'disposed' | 'sold';

export interface FixedAsset {
  id: string;
  name: string;
  category: AssetCategory;
  purchase_date: string;
  purchase_cost: number;
  residual_value: number;
  useful_life_years: number;
  depreciation_method: 'straight_line';
  status: AssetStatus;
  notes: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  // Calculated fields (frontend only)
  current_value?: number;
  accumulated_depreciation?: number;
  monthly_depreciation?: number;
}
