import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import { Eye, EyeOff } from 'lucide-react';
import { loginUser } from '../api/auth';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { user, token } = await loginUser(email.trim(), password);
      login(user, token);

      // Admin → branch selection with all branches
      if (user.role === 'admin') {
        navigate('/select-branch');
        return;
      }

      // User with branch permissions
      const branches = user.permissions?.branches || [];
      if (branches.length === 0) {
        setError('No branch access assigned. Contact administrator.');
        return;
      }
      if (branches.length === 1) {
        // Only 1 branch → auto select and go to dashboard
        const branchName = user.permissions?.branchNames?.[0] || `Branch ${branches[0]}`;
        localStorage.setItem('activeBranch', JSON.stringify({ id: branches[0], name: branchName }));
        navigate('/dashboard');
        return;
      }
      // Multiple branches → show branch selection screen
      navigate('/select-branch');
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-canvas min-h-screen flex flex-col">
      <header className="w-full px-8 md:px-12 py-6 flex justify-between items-center bg-transparent">
        <div className="text-2xl font-serif tracking-wide text-brand-primary">
          RS Bharti
        </div>
        <div className="text-[11px] font-medium tracking-brand-wide text-stone-500 uppercase">
          Institutional
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center px-6 py-20">
        <section className="w-full max-w-[480px] bg-white border border-brand-bg shadow-brand-card rounded-sm p-12 md:p-16">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-serif text-brand-primary mb-2">RS Bharti</h1>
            <p className="text-[11px] font-bold tracking-[0.25em] text-stone-500 uppercase">
              Secure Access Portal
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-10">
            {/* Email */}
            <div className="relative border-b border-stone-300 pb-2 transition-colors focus-within:border-brand-primary">
              <label className="block text-[11px] font-bold tracking-wider text-stone-500 uppercase mb-3">
                Email
              </label>
              <input
                type="email"
                placeholder="Enter your email"
                required
                className="w-full border-none p-0 focus:ring-0 text-[15px] text-stone-800 bg-transparent placeholder:text-stone-300 outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password */}
            <div className="relative border-b border-stone-300 pb-2 transition-colors focus-within:border-brand-primary">
              <label className="block text-[11px] font-bold tracking-wider text-stone-500 uppercase mb-3">
                Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                required
                className="w-full border-none p-0 focus:ring-0 text-[15px] text-stone-800 bg-transparent placeholder:text-stone-300 outline-none pr-8"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 bottom-2 text-stone-400 hover:text-brand-primary transition-colors focus:outline-none"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Error */}
            {error && (
              <p className="text-rose-600 text-[12px] font-medium text-center -mt-4">
                {error}
              </p>
            )}

            <div className="pt-2">
              <Button type="submit" className="w-full py-4" disabled={loading}>
                {loading ? 'Authenticating...' : 'Authenticate Access'}
              </Button>
            </div>

            <div className="text-center pt-2">
              <p className="text-[10px] text-stone-400 italic">
                Access is provided by the administrator only.
              </p>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
};

export default Login;
