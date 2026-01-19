import { useState, useEffect } from 'react';
import { Plus, Search, Printer, Trash2, Edit2, User, Calendar, DollarSign, Save, X, FileText } from 'lucide-react';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface SalarySlip {
  id: string;
  employee_name: string;
  period: string;
  date: string;
  basic_salary: number;
  allowance_position: number;
  allowance_transport: number;
  allowance_meal: number;
  bonus: number;
  overtime: number;
  deduction_loan: number;
  deduction_bpjs: number;
  deduction_tax: number;
  deduction_other: number;
  total_income: number;
  total_deduction: number;
  net_salary: number;
  status: 'draft' | 'paid';
  notes?: string;
}

export function PayrollSheet() {
  const { employees, addExpenseEntry } = useSupabaseData();
  const [slips, setSlips] = useState<SalarySlip[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [printingSlip, setPrintingSlip] = useState<SalarySlip | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<Partial<SalarySlip>>({
    employee_name: '',
    period: new Date().toISOString().slice(0, 7), // YYYY-MM
    date: new Date().toISOString().split('T')[0],
    basic_salary: 0,
    allowance_position: 0,
    allowance_transport: 0,
    allowance_meal: 0,
    bonus: 0,
    overtime: 0,
    deduction_loan: 0,
    deduction_bpjs: 0,
    deduction_tax: 0,
    deduction_other: 0,
    status: 'draft',
    notes: ''
  });

  const loadSlips = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('salary_slips')
        .select('*')
        .order('date', { ascending: false });
        
      if (error) {
        // If table doesn't exist yet, we just show empty
        if (error.code === 'PGRST205' || error.code === '42P01') {
            console.warn('Table salary_slips not found');
            setSlips([]);
        } else {
            console.error('Error loading slips:', error);
        }
      } else {
        setSlips(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSlips();
  }, []);

  const calculateTotal = (data: Partial<SalarySlip>) => {
    const income = (Number(data.basic_salary) || 0) + 
                   (Number(data.allowance_position) || 0) + 
                   (Number(data.allowance_transport) || 0) + 
                   (Number(data.allowance_meal) || 0) + 
                   (Number(data.bonus) || 0) + 
                   (Number(data.overtime) || 0);
                   
    const deduction = (Number(data.deduction_loan) || 0) + 
                      (Number(data.deduction_bpjs) || 0) + 
                      (Number(data.deduction_tax) || 0) + 
                      (Number(data.deduction_other) || 0);
                      
    return { income, deduction, net: income - deduction };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { income, deduction, net } = calculateTotal(formData);
      
      const payload = {
        ...formData,
        total_income: income,
        total_deduction: deduction,
        net_salary: net,
        // Ensure numeric fields are numbers
        basic_salary: Number(formData.basic_salary) || 0,
        allowance_position: Number(formData.allowance_position) || 0,
        allowance_transport: Number(formData.allowance_transport) || 0,
        allowance_meal: Number(formData.allowance_meal) || 0,
        bonus: Number(formData.bonus) || 0,
        overtime: Number(formData.overtime) || 0,
        deduction_loan: Number(formData.deduction_loan) || 0,
        deduction_bpjs: Number(formData.deduction_bpjs) || 0,
        deduction_tax: Number(formData.deduction_tax) || 0,
        deduction_other: Number(formData.deduction_other) || 0,
      };

      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        // @ts-ignore
        payload.user_id = userData.user.id;
      }

      // Save to salary_slips
      const { data, error } = await supabase
        .from('salary_slips')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      // Automatically create Expense Entry
      if (formData.status === 'paid') {
        await addExpenseEntry({
            date: formData.date || new Date().toISOString(),
            category: 'Gaji & Tunjangan',
            description: `Gaji ${formData.employee_name} Periode ${formData.period}`,
            amount: net,
            paymentMethod: 'Transfer', // Default
            paidTo: formData.employee_name,
            cashType: 'big',
            notes: `Auto-generated from Salary Slip #${data.id}`
        });
      }

      toast.success('Slip gaji berhasil dibuat');
      setShowForm(false);
      loadSlips();
      
    } catch (err: any) {
      console.error('Error saving slip:', err);
      toast.error('Gagal menyimpan slip: ' + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus slip gaji ini?')) return;
    
    const { error } = await supabase.from('salary_slips').delete().eq('id', id);
    if (error) {
        toast.error('Gagal menghapus');
    } else {
        toast.success('Terhapus');
        loadSlips();
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (printingSlip) {
    return (
        <div className="fixed inset-0 bg-white z-50 overflow-auto p-8">
            <div className="max-w-3xl mx-auto border border-gray-300 p-8 shadow-sm print:shadow-none print:border-none">
                <div className="flex justify-between items-start mb-8 border-b pb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">SLIP GAJI</h1>
                        <p className="text-gray-600">Periode: {printingSlip.period}</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-xl font-bold">PT. KARYA ABADI</h2>
                        <p className="text-sm text-gray-500">Jl. Contoh No. 123, Jakarta</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                        <p className="text-sm text-gray-500">Nama Karyawan</p>
                        <p className="font-semibold text-lg">{printingSlip.employee_name}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Tanggal Cetak</p>
                        <p className="font-semibold">{new Date().toLocaleDateString('id-ID')}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-8">
                    {/* Income */}
                    <div>
                        <h3 className="font-bold text-gray-900 mb-3 border-b pb-1">PENERIMAAN</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span>Gaji Pokok</span>
                                <span>{formatCurrency(printingSlip.basic_salary)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Tunj. Jabatan</span>
                                <span>{formatCurrency(printingSlip.allowance_position)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Tunj. Transport</span>
                                <span>{formatCurrency(printingSlip.allowance_transport)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Uang Makan</span>
                                <span>{formatCurrency(printingSlip.allowance_meal)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Bonus/Lembur</span>
                                <span>{formatCurrency(printingSlip.bonus + printingSlip.overtime)}</span>
                            </div>
                            <div className="flex justify-between font-bold pt-2 border-t mt-2">
                                <span>Total Penerimaan</span>
                                <span>{formatCurrency(printingSlip.total_income)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Deductions */}
                    <div>
                        <h3 className="font-bold text-gray-900 mb-3 border-b pb-1">POTONGAN</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span>Kasbon/Pinjaman</span>
                                <span>{formatCurrency(printingSlip.deduction_loan)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>BPJS</span>
                                <span>{formatCurrency(printingSlip.deduction_bpjs)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>PPh 21</span>
                                <span>{formatCurrency(printingSlip.deduction_tax)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Lain-lain</span>
                                <span>{formatCurrency(printingSlip.deduction_other)}</span>
                            </div>
                            <div className="flex justify-between font-bold pt-2 border-t mt-2 text-red-600">
                                <span>Total Potongan</span>
                                <span>{formatCurrency(printingSlip.total_deduction)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-100 p-4 rounded-lg mb-8">
                    <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-gray-900">GAJI BERSIH (TAKE HOME PAY)</span>
                        <span className="text-2xl font-bold text-blue-600">{formatCurrency(printingSlip.net_salary)}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 italic text-center">** Terbilang: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(printingSlip.net_salary)} **</p>
                </div>

                <div className="grid grid-cols-2 gap-8 mt-12 text-center text-sm">
                    <div>
                        <p className="mb-16">Penerima,</p>
                        <p className="font-bold border-t border-gray-300 inline-block px-8 pt-1">{printingSlip.employee_name}</p>
                    </div>
                    <div>
                        <p className="mb-16">Finance / HRD,</p>
                        <p className="font-bold border-t border-gray-300 inline-block px-8 pt-1">Admin</p>
                    </div>
                </div>

                {/* Print Controls */}
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex justify-center gap-4 print:hidden">
                    <button 
                        onClick={() => window.print()} 
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                        <Printer size={20} /> Cetak PDF
                    </button>
                    <button 
                        onClick={() => setPrintingSlip(null)} 
                        className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 flex items-center gap-2"
                    >
                        <X size={20} /> Tutup
                    </button>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Slip Gaji Karyawan</h1>
          <p className="text-gray-500">Kelola dan cetak slip gaji bulanan</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-sm"
        >
          <Plus size={20} />
          Buat Slip Baru
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                    <Users size={20} />
                </div>
                <h3 className="font-medium text-gray-600">Total Karyawan</h3>
            </div>
            <p className="text-2xl font-bold">{employees.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-100 rounded-lg text-green-600">
                    <DollarSign size={20} />
                </div>
                <h3 className="font-medium text-gray-600">Total Gaji Bulan Ini</h3>
            </div>
            <p className="text-2xl font-bold">
                {formatCurrency(
                    slips
                        .filter(s => s.period === new Date().toISOString().slice(0, 7))
                        .reduce((acc, curr) => acc + curr.net_salary, 0)
                )}
            </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                    <FileText size={20} />
                </div>
                <h3 className="font-medium text-gray-600">Slip Dibuat</h3>
            </div>
            <p className="text-2xl font-bold">{slips.length}</p>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-medium">
                    <tr>
                        <th className="px-4 py-3">Tanggal</th>
                        <th className="px-4 py-3">Periode</th>
                        <th className="px-4 py-3">Karyawan</th>
                        <th className="px-4 py-3 text-right">Penerimaan</th>
                        <th className="px-4 py-3 text-right">Potongan</th>
                        <th className="px-4 py-3 text-right">Gaji Bersih</th>
                        <th className="px-4 py-3 text-center">Status</th>
                        <th className="px-4 py-3 text-center">Aksi</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {loading ? (
                        <tr><td colSpan={8} className="p-8 text-center">Memuat data...</td></tr>
                    ) : slips.length === 0 ? (
                        <tr><td colSpan={8} className="p-8 text-center text-gray-500">Belum ada slip gaji dibuat.</td></tr>
                    ) : (
                        slips.map(slip => (
                            <tr key={slip.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3">{slip.date}</td>
                                <td className="px-4 py-3 font-medium">{slip.period}</td>
                                <td className="px-4 py-3">{slip.employee_name}</td>
                                <td className="px-4 py-3 text-right text-green-600">{formatCurrency(slip.total_income)}</td>
                                <td className="px-4 py-3 text-right text-red-600">{formatCurrency(slip.total_deduction)}</td>
                                <td className="px-4 py-3 text-right font-bold">{formatCurrency(slip.net_salary)}</td>
                                <td className="px-4 py-3 text-center">
                                    <span className={`px-2 py-1 rounded-full text-xs ${slip.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                        {slip.status === 'paid' ? 'Lunas' : 'Draft'}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <button 
                                            onClick={() => setPrintingSlip(slip)}
                                            className="p-1.5 hover:bg-blue-50 text-blue-600 rounded" title="Cetak Slip"
                                        >
                                            <Printer size={16} />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(slip.id)}
                                            className="p-1.5 hover:bg-red-50 text-red-600 rounded" title="Hapus"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold">Buat Slip Gaji Baru</h2>
                    <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700"><X size={24} /></button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Header Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-blue-50 p-4 rounded-lg">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Karyawan</label>
                            <select 
                                required
                                className="w-full rounded-lg border-gray-300"
                                value={formData.employee_name}
                                onChange={e => setFormData({...formData, employee_name: e.target.value})}
                            >
                                <option value="">Pilih Karyawan</option>
                                {employees.map(emp => (
                                    <option key={emp} value={emp}>{emp}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Periode</label>
                            <input 
                                type="month" 
                                required
                                className="w-full rounded-lg border-gray-300"
                                value={formData.period}
                                onChange={e => setFormData({...formData, period: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                            <input 
                                type="date" 
                                required
                                className="w-full rounded-lg border-gray-300"
                                value={formData.date}
                                onChange={e => setFormData({...formData, date: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Income Section */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-green-700 flex items-center gap-2 border-b pb-2">
                                <Plus size={16} /> Komponen Penerimaan
                            </h3>
                            <div>
                                <label className="text-sm text-gray-600">Gaji Pokok</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-gray-400">Rp</span>
                                    <input 
                                        type="number" className="w-full pl-10 rounded-lg border-gray-300"
                                        value={formData.basic_salary}
                                        onChange={e => setFormData({...formData, basic_salary: Number(e.target.value)})}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm text-gray-600">Tunjangan Jabatan</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-gray-400">Rp</span>
                                    <input 
                                        type="number" className="w-full pl-10 rounded-lg border-gray-300"
                                        value={formData.allowance_position}
                                        onChange={e => setFormData({...formData, allowance_position: Number(e.target.value)})}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm text-gray-600">Tunjangan Transport</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-gray-400">Rp</span>
                                    <input 
                                        type="number" className="w-full pl-10 rounded-lg border-gray-300"
                                        value={formData.allowance_transport}
                                        onChange={e => setFormData({...formData, allowance_transport: Number(e.target.value)})}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm text-gray-600">Uang Makan</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-gray-400">Rp</span>
                                    <input 
                                        type="number" className="w-full pl-10 rounded-lg border-gray-300"
                                        value={formData.allowance_meal}
                                        onChange={e => setFormData({...formData, allowance_meal: Number(e.target.value)})}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm text-gray-600">Bonus / Lembur</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-gray-400">Rp</span>
                                    <input 
                                        type="number" className="w-full pl-10 rounded-lg border-gray-300"
                                        value={formData.bonus}
                                        onChange={e => setFormData({...formData, bonus: Number(e.target.value)})}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Deduction Section */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-red-700 flex items-center gap-2 border-b pb-2">
                                <Trash2 size={16} /> Komponen Potongan
                            </h3>
                            <div>
                                <label className="text-sm text-gray-600">Kasbon / Pinjaman</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-gray-400">Rp</span>
                                    <input 
                                        type="number" className="w-full pl-10 rounded-lg border-gray-300"
                                        value={formData.deduction_loan}
                                        onChange={e => setFormData({...formData, deduction_loan: Number(e.target.value)})}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm text-gray-600">BPJS Kesehatan/TK</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-gray-400">Rp</span>
                                    <input 
                                        type="number" className="w-full pl-10 rounded-lg border-gray-300"
                                        value={formData.deduction_bpjs}
                                        onChange={e => setFormData({...formData, deduction_bpjs: Number(e.target.value)})}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm text-gray-600">PPh 21</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-gray-400">Rp</span>
                                    <input 
                                        type="number" className="w-full pl-10 rounded-lg border-gray-300"
                                        value={formData.deduction_tax}
                                        onChange={e => setFormData({...formData, deduction_tax: Number(e.target.value)})}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm text-gray-600">Lain-lain</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-gray-400">Rp</span>
                                    <input 
                                        type="number" className="w-full pl-10 rounded-lg border-gray-300"
                                        value={formData.deduction_other}
                                        onChange={e => setFormData({...formData, deduction_other: Number(e.target.value)})}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-100 p-4 rounded-lg flex justify-between items-center">
                        <span className="font-semibold">Estimasi Gaji Bersih:</span>
                        <span className="text-xl font-bold text-blue-600">
                            {formatCurrency(calculateTotal(formData).net)}
                        </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <input 
                            type="checkbox" 
                            id="status_paid"
                            checked={formData.status === 'paid'}
                            onChange={e => setFormData({...formData, status: e.target.checked ? 'paid' : 'draft'})}
                            className="rounded border-gray-300"
                        />
                        <label htmlFor="status_paid" className="text-sm text-gray-700">
                            Tandai "Lunas" dan catat otomatis di Pengeluaran (Kas)
                        </label>
                    </div>

                    <div className="flex gap-4 pt-4 border-t">
                        <button 
                            type="button" 
                            onClick={() => setShowForm(false)}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                            Batal
                        </button>
                        <button 
                            type="submit" 
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex justify-center items-center gap-2"
                        >
                            <Save size={18} /> Simpan Slip
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}
