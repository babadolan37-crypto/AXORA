import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { LogIn, UserPlus, Loader2, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';

interface AuthFormProps {
  onAuthSuccess: () => void;
}

export function AuthForm({ onAuthSuccess }: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(true); // Default ke LOGIN (user sudah punya akun)
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

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
        
        // Check if user needs to confirm email
        if (data.user && !data.session) {
          setMessage('Akun berhasil dibuat! Silakan cek email Anda untuk konfirmasi, lalu login.');
          setIsLogin(true);
          setName('');
          setPassword('');
          setConfirmPassword('');
        } else if (data.user && data.session) {
          // Auto login if email confirmation is disabled
          setMessage('Akun Anda berhasil dibuat! Mengalihkan ke dashboard...');
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
        setShowSetupGuide(true);
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
                    <p>✅ <strong>Belum punya akun?</strong> Klik tombol <strong>\"Daftar\"</strong> di atas</p>
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
            {!isForgotPassword && !isLogin && (
              <div>
                <label htmlFor="name" className="block text-gray-700 mb-2">
                  Nama
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
                      Daftar
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