import { useState } from 'react';
import { authClient } from '../lib/auth-client';
import { useTheme } from '../hooks/useTheme';

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { theme, toggleTheme } = useTheme();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isSignUp) {
        const { error: signUpError } = await authClient.signUp.email({
          name,
          email,
          password,
        });
        if (signUpError) {
          setError(signUpError.message || 'Đăng ký thất bại');
        } else {
          await authClient.signOut();
          setSuccess('Tài khoản đã được tạo, vui lòng chờ phê duyệt từ quản trị viên.');
          setIsSignUp(false);
          setName('');
          setPassword('');
        }
      } else {
        const { error: signInError } = await authClient.signIn.email({
          email,
          password,
          rememberMe,
        });
        if (signInError) {
          if (signInError.message?.toLowerCase().includes('ban')) {
            setError('Tài khoản chưa được phê duyệt. Vui lòng chờ quản trị viên xác nhận.');
          } else {
            setError(signInError.message || 'Đăng nhập thất bại');
          }
        } else {
          window.location.href = '/';
        }
      }
    } catch {
      setError('Đã xảy ra lỗi. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-[#141414] text-neutral-800 dark:text-neutral-200 font-sans flex items-center justify-center px-4">
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-stone-100 dark:hover:bg-neutral-900 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M10 2a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 2ZM10 15a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 15ZM10 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM15.657 5.404a.75.75 0 1 0-1.06-1.06l-1.061 1.06a.75.75 0 0 0 1.06 1.06l1.06-1.06ZM6.464 14.596a.75.75 0 1 0-1.06-1.06l-1.06 1.06a.75.75 0 0 0 1.06 1.06l1.06-1.06ZM18 10a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 18 10ZM5 10a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 5 10ZM14.596 15.657a.75.75 0 0 0 1.06-1.06l-1.06-1.061a.75.75 0 1 0-1.06 1.06l1.06 1.06ZM5.404 6.464a.75.75 0 0 0 1.06-1.06l-1.06-1.06a.75.75 0 1 0-1.06 1.06l1.06 1.06Z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M7.455 2.004a.75.75 0 0 1 .26.77 7 7 0 0 0 9.958 7.967.75.75 0 0 1 1.067.853A8.5 8.5 0 1 1 6.647 1.921a.75.75 0 0 1 .808.083Z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      </div>

      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-serif font-bold tracking-[-0.01em]">Phân tích thị trường xăng dầu</h1>
          <p className="text-[11px] uppercase tracking-[0.1em] text-neutral-700 dark:text-neutral-300 mt-1">
            {isSignUp ? 'Tạo tài khoản mới' : 'Đăng nhập'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 text-sm bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 text-sm bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 rounded">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label htmlFor="name" className="block text-xs font-medium uppercase tracking-wider mb-1">
                Tên
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded text-sm focus:outline-none focus:ring-1 focus:ring-neutral-800 dark:focus:ring-neutral-200"
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-xs font-medium uppercase tracking-wider mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded text-sm focus:outline-none focus:ring-1 focus:ring-neutral-800 dark:focus:ring-neutral-200"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-medium uppercase tracking-wider mb-1">
              Mật khẩu
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded text-sm focus:outline-none focus:ring-1 focus:ring-neutral-800 dark:focus:ring-neutral-200"
            />
          </div>

          {!isSignUp && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-neutral-300 dark:border-neutral-700"
              />
              Ghi nhớ đăng nhập
            </label>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-800 text-sm font-medium rounded hover:bg-neutral-700 dark:hover:bg-neutral-300 transition-colors disabled:opacity-50"
          >
            {loading ? '...' : isSignUp ? 'Đăng ký' : 'Đăng nhập'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-600 dark:text-neutral-400">
          {isSignUp ? (
            <>
              Đã có tài khoản?{' '}
              <button onClick={() => { setIsSignUp(false); setError(''); setSuccess(''); }} className="underline hover:text-neutral-800 dark:hover:text-neutral-200">
                Đăng nhập
              </button>
            </>
          ) : (
            <>
              Chưa có tài khoản?{' '}
              <button onClick={() => { setIsSignUp(true); setError(''); setSuccess(''); }} className="underline hover:text-neutral-800 dark:hover:text-neutral-200">
                Đăng ký
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
