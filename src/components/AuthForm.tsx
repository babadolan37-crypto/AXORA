import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { LogIn, UserPlus, Loader2, AlertCircle, Eye, EyeOff, Shield, Building2, CheckCircle2 } from 'lucide-react';

interface AuthFormProps {
  onAuthSuccess: () => void;
}

export function AuthForm({ onAuthSuccess }: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(true); // Default ke LOGIN (user sudah punya akun)
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [companyFlow, setCompanyFlow] = useState<'create' | 'join'>('create');
  const [companyName, setCompanyName] = useState('');
  const [companyCode, setCompanyCode] = useState('');
  const [checkedCompany, setCheckedCompany] = useState<{name: string, id: string} | null>(null);

  const checkCompanyCode = async () => {
    if (!companyCode.trim()) {
      setError('Masukkan kode perusahaan terlebih dahulu');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .eq('code', companyCode.trim().toUpperCase())
        .maybeSingle();
        
      if (error) throw error;
      
      if (data) {
        setCheckedCompany(data);
        setError(''); // Clear error if any
      } else {
        setCheckedCompany(null);
        setError('Kode perusahaan tidak ditemukan. Pastikan kode benar.');
      }
    } catch (err: any) {
      console.error('Error checking code:', err);
      setError('Gagal mengecek kode perusahaan.');
    } finally {
      setLoading(false);
    }
  };

  const ensureCompanySetup = async (userId: string) => {
    const { data: existing } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', userId)
      .maybeSingle();

    // If user already has a company, verify it matches if companyCode is provided
    if (existing?.company_id) {
        if (companyCode.trim()) {
            const { data: company } = await supabase
                .from('companies')
                .select('code')
                .eq('id', existing.company_id)
                .maybeSingle();
                
            if (company && company.code !== companyCode.trim().toUpperCase()) {
                throw new Error('Akun Anda tidak terdaftar pada kode perusahaan ini.');
            }
        }
        return;
    }

    // New user setup logic
    if (companyFlow === 'create') {
      if (!companyName.trim()) return;
      const code = Math.random().toString(36).slice(2, 8).toUpperCase();
      const { data: company, error: createError } = await supabase
        .from('companies')
        .insert({
          name: companyName.trim(),
          code
        })
        .select()
        .maybeSingle();
      
      if (createError) throw createError;
      
      if (company) {
        await supabase
          .from('profiles')
          .upsert({
            id: userId,
            company_id: company.id,
            role: 'owner',
            full_name: name || email,
            email
          }, { onConflict: 'id' });
        await supabase
          .from('company_settings')
          .upsert({ company_id: company.id }, { onConflict: 'company_id' });
      }
    } else {
      // Joining existing company
      if (!checkedCompany && !companyCode.trim()) {
         throw new Error('Kode perusahaan diperlukan');
      }
      
      // Double check if not already checked
      let targetCompanyId = checkedCompany?.id;
      if (!targetCompanyId) {
          const { data: company } = await supabase
            .from('companies')
            .select('id')
            .eq('code', companyCode.trim().toUpperCase())
            .maybeSingle();
            
          if (!company) throw new Error('Kode perusahaan tidak valid');
          targetCompanyId = company.id;
      }
      
      await supabase
        .from('profiles')
        .upsert({
          id: userId,
          company_id: targetCompanyId,
          role: 'employee',
          full_name: name || email,
          email
        }, { onConflict: 'id' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      // Forgot Password
      if (isForgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}`,
        });

        if (error) throw error;
        setMessage('Link reset password telah dikirim ke email Anda. Silakan cek inbox.');
        setIsForgotPassword(false);
        setEmail('');
        return;
      }

      // Login
      if (isLogin) {
        if (!companyCode.trim()) {
            setError('Kode perusahaan wajib diisi untuk login.');
            setLoading(false);
            return;
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        
        if (data.user) {
          // Validate Company Code Match
          try {
            await ensureCompanySetup(data.user.id);
            setMessage('Login berhasil! Selamat datang kembali...');
            setTimeout(() => {
                onAuthSuccess();
            }, 500);
          } catch (validationError: any) {
              // Logout if validation fails
              await supabase.auth.signOut();
              setError(validationError.message || 'Gagal memvalidasi perusahaan.');
          }
        }
      } 
      // Register
      else {
        // Validasi konfirmasi password
        if (password !== confirmPassword) {
          setError('Password dan konfirmasi password tidak sama!');
          setLoading(false);
          return;
        }

        // Validasi nama
        if (!name.trim()) {
          setError('Nama tidak boleh kosong!');
          setLoading(false);
          return;
        }

        // Validasi Company Flow
        if (companyFlow === 'create' && !companyName.trim()) {
            setError('Nama perusahaan wajib diisi!');
            setLoading(false);
            return;
        }
        if (companyFlow === 'join' && !checkedCompany) {
             // Try to check code if user hasn't clicked check button
             if (companyCode.trim()) {
                 const { data } = await supabase
                    .from('companies')
                    .select('id, name')
                    .eq('code', companyCode.trim().toUpperCase())
                    .maybeSingle();
                 if (!data) {
                     setError('Kode perusahaan tidak valid. Silakan cek kembali.');
                     setLoading(false);
                     return;
                 }
                 setCheckedCompany(data);
             } else {
                 setError('Kode perusahaan wajib diisi dan divalidasi!');
                 setLoading(false);
                 return;
             }
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              name: name.trim(),
            }
          }
        });

        if (error) throw error;
        
        if (data.user) {
           try {
              if (data.session) {
                  // User created and logged in (no email confirm required)
                  await ensureCompanySetup(data.user.id);
                  setMessage('Akun Anda berhasil dibuat! Mengalihkan ke dashboard...');
                  setTimeout(() => {
                    onAuthSuccess();
                  }, 1000);
              } else {
                  // Email confirmation required
                  // We still need to link the profile/company potentially? 
                  // Usually triggers aren't reliable for custom logic without RPC.
                  // But since we can't run code for unconfirmed user easily, we wait.
                  // Ideally we should use a Postgres Trigger for profile creation on auth.users insert.
                  // For now, assume flow works or email confirm is off.
                  setMessage('Akun berhasil dibuat! Silakan cek email Anda untuk konfirmasi.');
                  setIsLogin(true);
                  setName('');
                  setPassword('');
                  setConfirmPassword('');
              }
           } catch (setupError: any) {
               console.error('Setup error:', setupError);
               // If setup fails but user created, they might be in inconsistent state.
               // Ideally we should rollback or show specific error.
               setError('Akun dibuat tapi gagal setup perusahaan: ' + setupError.message);
           }
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      
      // Error handling (same as before)
      if (err.message.includes('Email logins are disabled')) {
        setMessage('⚠️ Supabase Email Auth belum diaktifkan.');
      } else if (err.message.includes('Invalid login credentials')) {
         setError('❌ Email atau password salah.');
      } else if (err.message.includes('Email not confirmed')) {
        setError('📧 Akun Anda sudah terdaftar, tapi email belum dikonfirmasi.');
      } else if (err.message.includes('User already registered')) {
        setError('Email sudah terdaftar. Silakan login.');
      } else {
        setError(err.message || 'Terjadi kesalahan, silakan coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 py-8">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <LogIn className="text-white" size={32} />
            </div>
            <h1 className="text-gray-900 mb-2">Babadolan</h1>
            <p className="text-gray-600">Pencatatan Keuangan Perusahaan</p>
          </div>

          {/* First Time User Banner */}
          {!isLogin && !isForgotPassword && (
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="bg-blue-600 text-white p-2 rounded-lg">
                  <UserPlus size={20} />
                </div>
                <div className="flex-1">
                  <h3 className="text-blue-900 mb-1">👋 Pengguna Baru?</h3>
                  <p className="text-sm text-blue-700">
                    Daftar akun dan gabung ke perusahaan Anda menggunakan <strong>Kode Perusahaan</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Toggle Login/Register */}
          <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => {
                setIsLogin(true);
                setIsForgotPassword(false);
                setError('');
                setMessage('');
                setCompanyCode(''); // Reset code
              }}
              className={`flex-1 py-2 px-4 rounded-md transition-all ${
                isLogin && !isForgotPassword
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => {
                setIsLogin(false);
                setIsForgotPassword(false);
                setError('');
                setMessage('');
                setCompanyCode(''); // Reset code
              }}
              className={`flex-1 py-2 px-4 rounded-md transition-all ${
                !isLogin && !isForgotPassword
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Daftar
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* COMPANY CODE INPUT FOR LOGIN */}
            {isLogin && !isForgotPassword && (
                <div>
                    <label htmlFor="loginCompanyCode" className="block text-gray-700 mb-2 font-medium">
                        Kode Perusahaan <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            id="loginCompanyCode"
                            type="text"
                            value={companyCode}
                            onChange={(e) => setCompanyCode(e.target.value.toUpperCase())}
                            required
                            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all uppercase tracking-wider font-mono"
                            placeholder="Contoh: XY7Z99"
                            disabled={loading}
                        />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Masukkan kode perusahaan tempat Anda bekerja.</p>
                </div>
            )}

            {!isForgotPassword && !isLogin && (
              <div>
                <label htmlFor="name" className="block text-gray-700 mb-2">
                  Nama Lengkap
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="Nama lengkap Anda"
                  disabled={loading}
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="nama@email.com"
                disabled={loading}
              />
            </div>

            {!isForgotPassword && (
              <div>
                <label htmlFor="password" className="block text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="Minimal 6 karakter"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            )}

            {!isForgotPassword && !isLogin && (
              <div>
                <label htmlFor="confirmPassword" className="block text-gray-700 mb-2">
                  Konfirmasi Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="Ketik ulang password Anda"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            )}

            {/* COMPANY SETUP FOR REGISTRATION */}
            {!isLogin && !isForgotPassword && (
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <p className="font-medium text-gray-700">Pengaturan Perusahaan</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                        setCompanyFlow('create');
                        setCompanyCode('');
                        setCheckedCompany(null);
                        setError('');
                    }}
                    className={`flex-1 py-2 px-3 text-sm rounded-md transition-all border ${
                      companyFlow === 'create' 
                        ? 'bg-blue-50 border-blue-200 text-blue-700 ring-1 ring-blue-500' 
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Buat Baru
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                        setCompanyFlow('join');
                        setCompanyName('');
                        setError('');
                    }}
                    className={`flex-1 py-2 px-3 text-sm rounded-md transition-all border ${
                      companyFlow === 'join' 
                        ? 'bg-blue-50 border-blue-200 text-blue-700 ring-1 ring-blue-500' 
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Gabung (Punya Kode)
                  </button>
                </div>

                {companyFlow === 'create' ? (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="block text-gray-700 mb-2">Nama Perusahaan Baru</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Contoh: PT Maju Jaya"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      disabled={loading}
                    />
                    <p className="text-xs text-gray-500 mt-1">Kode perusahaan akan dibuat otomatis.</p>
                  </div>
                ) : (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="block text-gray-700 mb-2">Kode Perusahaan</label>
                    <div className="flex gap-2">
                        <input
                        type="text"
                        value={companyCode}
                        onChange={(e) => {
                            setCompanyCode(e.target.value.toUpperCase());
                            setCheckedCompany(null); // Reset check if changed
                        }}
                        placeholder="Masukkan kode"
                        className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all uppercase font-mono"
                        disabled={loading}
                        />
                        <button
                            type="button"
                            onClick={checkCompanyCode}
                            disabled={loading || !companyCode.trim()}
                            className="bg-gray-800 text-white px-4 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
                        >
                            Cek
                        </button>
                    </div>
                    {checkedCompany && (
                        <div className="mt-2 flex items-center gap-2 text-green-600 bg-green-50 p-2 rounded-lg border border-green-100">
                            <CheckCircle2 size={16} />
                            <span className="text-sm font-medium">Perusahaan ditemukan: {checkedCompany.name}</span>
                        </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
                <AlertCircle size={20} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {message && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg" dangerouslySetInnerHTML={{ __html: message }}>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  {isForgotPassword ? (
                    <>
                      <LogIn size={20} />
                      Reset Password
                    </>
                  ) : isLogin ? (
                    <>
                      <LogIn size={20} />
                      Masuk
                    </>
                  ) : (
                    <>
                      <UserPlus size={20} />
                      Daftar Akun
                    </>
                  )}
                </>
              )}
            </button>

            {/* Forgot Password Link */}
            {isLogin && !isForgotPassword && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(true);
                    setIsLogin(false);
                    setError('');
                    setMessage('');
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Lupa password?
                </button>
              </div>
            )}

            {/* Back to Login from Forgot Password */}
            {isForgotPassword && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setIsLogin(true);
                    setError('');
                    setMessage('');
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Kembali ke Login
                </button>
              </div>
            )}
          </form>

          {/* Info */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600 text-center">
              {isForgotPassword ? (
                'Masukkan email Anda untuk menerima link reset password'
              ) : isLogin ? (
                'Belum punya akun? Klik tombol Daftar di atas'
              ) : (
                'Sudah punya akun? Klik tombol Login di atas'
              )}
            </p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
