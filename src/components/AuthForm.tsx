import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { LogIn, UserPlus, Loader2, AlertCircle, Eye, EyeOff, Shield, Building2, UserPlus2 } from 'lucide-react';

interface AuthFormProps {
  onAuthSuccess: () => void;
}

export function AuthForm({ onAuthSuccess }: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  
  const [registerMode, setRegisterMode] = useState<'individual' | 'company_join' | 'company_create'>('individual');
  const [loginWithCode, setLoginWithCode] = useState(false);
  const [loginCompanyCode, setLoginCompanyCode] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Company Data
  const [companyName, setCompanyName] = useState('');
  const [companyCode, setCompanyCode] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Generate random code for new company
  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCompanyCode(code);
  };

  useEffect(() => {
    if (!isLogin && registerMode === 'company_create' && !companyCode) {
      generateCode();
    }
  }, [isLogin, registerMode]);

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
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        
        if (data.user) {
          // If login with code is enabled, verify membership
          if (loginWithCode && loginCompanyCode) {
             // Because of RLS, we can only select the company if we are a member of it
             const { data: companyData, error: companyError } = await supabase
               .from('companies')
               .select('code')
               .eq('code', loginCompanyCode.trim())
               .single();
             
             if (companyError || !companyData) {
               // If validation fails, sign out immediately
               await supabase.auth.signOut();
               setError('Anda tidak terdaftar di perusahaan dengan kode tersebut, atau kode salah.');
               setLoading(false);
               return;
             }
          }

          setMessage('Login berhasil! Selamat datang kembali...');
          setTimeout(() => {
            onAuthSuccess();
          }, 500);
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

        // Validate Company Data
        if (registerMode === 'company_create' && !companyName.trim()) {
          setError('Nama Perusahaan wajib diisi!');
          setLoading(false);
          return;
        }
        if (registerMode === 'company_join' && !companyCode.trim()) {
          setError('Kode Perusahaan wajib diisi!');
          setLoading(false);
          return;
        }

        // 1. Sign Up Auth User
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name.trim(),
            }
          }
        });

        if (signUpError) throw signUpError;

        if (data.user) {
          // 2. Setup Company / Profile based on Mode
          if (registerMode === 'individual') {
             // Create "Personal" Company
             const { data: res, error: rpcError } = await supabase.rpc('create_new_company', {
              input_name: `Pribadi - ${name.trim()}`,
              input_code: 'PERSONAL-' + Math.floor(Math.random() * 10000), // Dummy code
              user_name: name.trim()
            });
            
            if (rpcError || !res.success) {
              console.error('Create Personal Company Error:', rpcError || res);
              throw new Error(res?.message || 'Gagal membuat akun. Hubungi support.');
            }
          } else if (registerMode === 'company_create') {
            const { data: res, error: rpcError } = await supabase.rpc('create_new_company', {
              input_name: companyName.trim(),
              input_code: companyCode.trim(),
              user_name: name.trim()
            });
            
            if (rpcError || !res.success) {
              console.error('Create Company Error:', rpcError || res);
              throw new Error(res?.message || 'Gagal membuat perusahaan. Hubungi support.');
            }
          } else if (registerMode === 'company_join') {
            const { data: res, error: rpcError } = await supabase.rpc('join_company', {
              input_code: companyCode.trim(),
              user_name: name.trim()
            });

            if (rpcError || !res.success) {
              console.error('Join Company Error:', rpcError || res);
              throw new Error(res?.message || 'Gagal bergabung. Periksa Kode Perusahaan Anda.');
            }
          }

          setMessage('Akun berhasil dibuat! Mengalihkan ke dashboard...');
          setTimeout(() => {
            onAuthSuccess();
          }, 1000);
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      
      // Supabase Email Auth belum diaktifkan
      if (err.message.includes('Email logins are disabled') || err.message.includes('Email signups are disabled')) {
        setError('');
        setMessage('⚠️ Supabase Email Auth belum diaktifkan. Silakan ikuti langkah berikut:');
        setLoading(false);
        return;
      }
      
      // Email address dianggap invalid oleh Supabase (setup issue)
      if (err.message.includes('is invalid') || (err.message.includes('Email address') && err.message.includes('invalid'))) {
        setError('');
        setMessage('⚠️ Supabase Email Provider belum di-setup dengan benar. Silakan hubungi administrator.');
        setLoading(false);
        return;
      }
      
      if (err.message.includes('Invalid login credentials')) {
        if (isLogin) {
          setError('❌ Email atau password salah.');
          setMessage('💡 <strong>Belum punya akun?</strong> Klik tombol "Daftar" di atas untuk membuat akun baru. Atau gunakan "Lupa password?" untuk reset password Anda.');
        } else {
          setError('Terjadi kesalahan saat registrasi. Silakan coba lagi.');
        }
      } else if (err.message.includes('Email not confirmed')) {
        setError('📧 Akun Anda sudah terdaftar, tapi email belum dikonfirmasi.');
        setMessage('💡 Silakan cek inbox email Anda dan klik link konfirmasi, lalu login kembali. Cek folder Spam jika tidak ada di Inbox.');
      } else if (err.message.includes('User already registered')) {
        setError('Email sudah terdaftar. Silakan gunakan email lain atau login dengan akun tersebut.');
        setMessage('💡 Klik tombol "Login" di atas jika sudah punya akun.');
        setTimeout(() => setIsLogin(true), 2000);
      } else if (err.message.includes('Password should be at least')) {
        setError('❌ Password terlalu pendek. Minimal 6 karakter.');
      } else if (err.message.includes('Unable to validate email address')) {
        setError('❌ Format email tidak valid. Gunakan format: nama@email.com');
      } else {
        setError(err.message || 'Terjadi kesalahan saat memproses permintaan Anda, silakan coba lagi.');
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
                    Mulai dengan <strong>membuat akun gratis</strong> di bawah ini. Isi form, klik Daftar, dan langsung mulai mencatat keuangan perusahaan Anda!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Login Helper Banner */}
          {isLogin && !isForgotPassword && (
            <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="bg-yellow-600 text-white p-2 rounded-lg">
                  <AlertCircle size={20} />
                </div>
                <div className="flex-1">
                  <h3 className="text-yellow-900 mb-1">🔑 Gagal Login?</h3>
                  <div className="text-sm text-yellow-700 space-y-1">
                    <p>✅ Pastikan email & password sudah benar</p>
                    <p>✅ Klik ikon 👁️ untuk cek password yang Anda ketik</p>
                    <p>✅ <strong>Belum punya akun?</strong> Klik tombol <strong>"Daftar"</strong> di atas</p>
                  </div>
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
              }}
              className={`flex-1 py-2 px-4 rounded-md transition-all ${
                isLogin && !isForgotPassword
                  ? 'bg-white text-blue-600 shadow-sm font-medium'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={() => {
                setIsLogin(false);
                setIsForgotPassword(false);
                setError('');
                setMessage('');
              }}
              className={`flex-1 py-2 px-4 rounded-md transition-all ${
                !isLogin && !isForgotPassword
                  ? 'bg-white text-blue-600 shadow-sm font-medium'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Daftar Baru
            </button>
          </div>

          {/* REGISTER MODE SWITCH: CREATE vs JOIN */}
          {!isLogin && !isForgotPassword && (
            <div className="flex gap-2 mb-6">
              <button
                type="button"
                onClick={() => setRegisterMode('company_create')}
                className={`flex-1 p-3 rounded-xl border-2 text-left transition-all ${
                  registerMode === 'company_create'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Building2 size={18} className={registerMode === 'company_create' ? 'text-blue-600' : 'text-gray-500'} />
                  <span className={`font-semibold ${registerMode === 'company_create' ? 'text-blue-900' : 'text-gray-700'}`}>Buat PT Baru</span>
                </div>
                <p className="text-xs text-gray-500">Saya pemilik perusahaan</p>
              </button>
              
              <button
                type="button"
                onClick={() => setRegisterMode('company_join')}
                className={`flex-1 p-3 rounded-xl border-2 text-left transition-all ${
                  registerMode === 'company_join'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-green-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <UserPlus2 size={18} className={registerMode === 'company_join' ? 'text-green-600' : 'text-gray-500'} />
                  <span className={`font-semibold ${registerMode === 'company_join' ? 'text-green-900' : 'text-gray-700'}`}>Gabung Tim</span>
                </div>
                <p className="text-xs text-gray-500">Saya karyawan / staff</p>
              </button>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* LOGIN: Company Code Toggle */}
            {isLogin && !isForgotPassword && (
              <div className="mb-4">
                 <label className="flex items-center gap-2 cursor-pointer mb-2">
                    <input 
                      type="checkbox" 
                      checked={loginWithCode} 
                      onChange={(e) => setLoginWithCode(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Login dengan Akun Perusahaan?</span>
                 </label>
                 
                 {loginWithCode && (
                   <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg animate-in fade-in slide-in-from-top-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Kode Perusahaan
                      </label>
                      <input
                        type="text"
                        value={loginCompanyCode}
                        onChange={(e) => setLoginCompanyCode(e.target.value.toUpperCase())}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono uppercase"
                        placeholder="Contoh: WEALTH-99"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Jika Anda belum memiliki kode perusahaan, silakan hubungi admin atau pilih opsi untuk meminta kode perusahaan baru.
                      </p>
                   </div>
                 )}
              </div>
            )}

            {!isForgotPassword && !isLogin && (
              <>
                {/* COMPANY REGISTRATION SUB-MODES */}
                {registerMode.startsWith('company') && (
                  <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-lg space-y-4 mb-4">
                    {registerMode === 'company_join' ? (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-indigo-900 mb-1">Kode Perusahaan</label>
                          <input
                            type="text"
                            value={companyCode}
                            onChange={(e) => setCompanyCode(e.target.value.toUpperCase())}
                            className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none font-mono tracking-wider uppercase"
                            placeholder="Contoh: WEALTH-99"
                            required
                          />
                          <p className="text-xs text-indigo-700 mt-2">
                            Jika Anda memilih Akun Perusahaan, Anda akan diminta untuk memasukkan kode perusahaan yang akan diberikan oleh admin.
                          </p>
                        </div>
                        
                        <div className="pt-2 border-t border-indigo-200">
                          <p className="text-sm text-indigo-800 mb-2">Anda belum memiliki kode perusahaan?</p>
                          <button
                            type="button"
                            onClick={() => {
                              setRegisterMode('company_create');
                              generateCode();
                            }}
                            className="text-sm font-medium text-indigo-600 hover:text-indigo-800 underline"
                          >
                            Minta Kode Perusahaan Baru &raquo;
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-center mb-2">
                           <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 mb-2">
                             <Shield size={20} />
                           </div>
                           <h4 className="font-semibold text-indigo-900">Pengajuan Kode Baru</h4>
                        </div>
                        
                        <p className="text-sm text-indigo-700 mb-3">
                           Anda belum memiliki kode perusahaan. Untuk membuat akun perusahaan baru, kami akan memberikan kode unik yang akan digunakan untuk login.
                        </p>

                        <div>
                          <label className="block text-sm font-medium text-indigo-900 mb-1">Nama Perusahaan Baru</label>
                          <input
                            type="text"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="Contoh: PT Maju Jaya"
                            required
                          />
                        </div>
                        
                        <div className="pt-2 border-t border-indigo-200">
                          <button
                            type="button"
                            onClick={() => setRegisterMode('company_join')}
                            className="text-xs text-indigo-500 hover:text-indigo-700"
                          >
                            &laquo; Kembali: Saya sudah punya kode
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
                
                <div className="border-t border-gray-100 my-4 pt-4"></div>

                <div>
                  <label htmlFor="name" className="block text-gray-700 mb-2">
                    Nama Lengkap Anda
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
              </>
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
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {message && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg" dangerouslySetInnerHTML={{ __html: message }}>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                      {registerMode === 'company_create' ? 'Minta Kode Perusahaan Baru' : registerMode === 'company_join' ? 'Gabung Perusahaan' : 'Daftar Akun Individu'}
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

          {/* Security Info */}
          {!isLogin && !isForgotPassword && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-xs text-green-800 text-center">
                🔐 Password Anda akan disimpan dengan aman menggunakan enkripsi. Pastikan password yang Anda buat cukup kuat.
              </p>
            </div>
          )}
        </div>
      </div>

        {/* Footer Note */}
        <div className="mt-6 text-center text-sm text-gray-600 bg-white/50 backdrop-blur-sm rounded-lg p-4">
          <p>🔒 Data Anda tersimpan dengan aman</p>
          <p className="mt-1">Bisa diakses dari device manapun</p>
        </div>
      </div>
    </div>
  );
}
