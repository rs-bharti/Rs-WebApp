import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import { Eye } from 'lucide-react';

const Login = ({ onLogin }) => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Simple mock logic for role switching
    const role = (username === 'adminuser' || username === 'admin@gmail.com') ? 'admin' : 'user';
    localStorage.setItem('userRole', role);
    localStorage.setItem('userName', username || 'Standard User');
    
    if (onLogin) onLogin(role);
    navigate('/dashboard');
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
            <div className="relative border-b border-stone-300 pb-2 transition-colors focus-within:border-brand-primary">
              <label className="block text-[11px] font-bold tracking-wider text-stone-500 uppercase mb-3">
                Username/Email
              </label>
              <input
                type="text"
                placeholder="Enter identity"
                className="w-full border-none p-0 focus:ring-0 text-[15px] text-stone-800 bg-transparent placeholder:text-stone-300 outline-none"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <Select 
              label="Branch Selection"
              options={[
                { label: 'Select location', value: '', disabled: true },
                { label: 'North Branch', value: 'north' },
                { label: 'South Branch', value: 'south' },
                { label: 'Central HQ', value: 'central' },
              ]}
              defaultValue=""
            />

            <div className="relative">
              <Input 
                label="Credential Key"
                type={showPassword ? 'text' : 'password'}
                placeholder="..."
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 bottom-2 text-stone-400 hover:text-brand-primary transition-colors focus:outline-none"
              >
                <Eye className="h-4 w-4" />
              </button>
            </div>

            <div className="pt-6">
              <Button type="submit" className="w-full py-4">
                Authenticate Access
              </Button>
            </div>

            <div className="text-center pt-2">
              <p className="text-[10px] text-stone-400 mb-4 italic">
                Tip: Use "adminuser" for Admin view, any other name for User view.
              </p>
              <a href="#" className="text-[11px] text-stone-500 border-b border-transparent hover:border-stone-500 hover:text-brand-primary transition-all duration-300 uppercase tracking-widest">
                Forgot Access
              </a>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
};

export default Login;
