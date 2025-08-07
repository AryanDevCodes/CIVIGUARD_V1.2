import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import Logo from '@/components/Logo';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Lock, Mail, User as UserIcon } from 'lucide-react';
import { motion } from 'framer-motion';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    aadhaar: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [aadhaarError, setAadhaarError] = useState('');

  const { isLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const validateAadhaar = (aadhaar: string) => {
    if (!/^\d{12}$/.test(aadhaar)) {
      setAadhaarError('Aadhaar must be a 12-digit number');
      return false;
    }
    setAadhaarError('');
    return true;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    if (id === 'aadhaar') validateAadhaar(value);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const { name, email, password, aadhaar } = formData;

    if (!name || !email || !password || !aadhaar) {
      setError('Please fill in all fields');
      return;
    }

    if (!validateAadhaar(aadhaar)) return;

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, role: 'CITIZEN' }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Signup failed');
      }

      toast({
        title: 'Signup successful',
        description: 'You can now log in!'
      });

      navigate('/login');
    } catch (err: any) {
      const message = err.message || 'Signup failed. Please try again.';
      setError(message);
      toast({
        title: 'Signup failed',
        description: message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-neutral-900 to-zinc-800 p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md glass-card relative rounded-2xl"
      >
        <div className="absolute inset-[-1px] rounded-[inherit] p-[1px] bg-gradient-to-r from-white/10 to-white/5 [mask:linear-gradient(black,black) content-box,linear-gradient(black,black)]" />
        <CardHeader className="space-y-1 flex flex-col items-center z-10 relative">
          <Logo className="mb-4 scale-110" />
          <CardTitle className="text-white text-2xl font-semibold font-montserrat">Create Your Account</CardTitle>
          <p className="text-sm text-gray-400">Sign up to join CiviGuard</p>
        </CardHeader>
        <CardContent className="z-10 relative">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSignup} className="space-y-4">
            <Field
              id="name"
              label="Name"
              type="text"
              icon={<UserIcon className="icon-class text-gray-400" />}
              placeholder="Your name"
              value={formData.name}
              onChange={handleChange}
            />
            <Field
              id="email"
              label="Email"
              type="email"
              icon={<Mail className="icon-class text-gray-400" />}
              placeholder="name@example.com"
              value={formData.email}
              onChange={handleChange}
            />
            <Field
              id="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              icon={<Lock className="icon-class text-gray-400" />}
              placeholder="Create a password"
              value={formData.password}
              onChange={handleChange}
              togglePassword={() => setShowPassword(!showPassword)}
              showToggle
            />
            <Field
              id="aadhaar"
              label="Aadhaar Number"
              type="text"
              icon={<UserIcon className="icon-class text-gray-400" />}
              placeholder="12-digit Aadhaar"
              value={formData.aadhaar}
              onChange={handleChange}
              error={aadhaarError}
            />
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-white to-gray-200 text-black font-semibold py-2 rounded-md hover:from-gray-100 hover:to-white transition"
              disabled={isLoading}
            >
              {isLoading ? 'Signing up...' : 'Sign up'}
            </Button>
            <div className="text-center mt-6">
              <Button
                type="button"
                variant="link"
                className="text-sm text-gray-300 hover:underline"
                onClick={() => navigate('/login')}
              >
                Already have an account? Sign in
              </Button>
            </div>
          </form>
        </CardContent>
      </motion.div>
    </div>
  );
};

// Reusable input field component
const Field = ({
  id,
  label,
  type,
  placeholder,
  icon,
  value,
  onChange,
  error,
  togglePassword,
  showToggle
}: {
  id: string;
  label: string;
  type: string;
  placeholder: string;
  icon: React.ReactNode;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  togglePassword?: () => void;
  showToggle?: boolean;
}) => (
  <div className="space-y-2">
    <Label htmlFor={id} className="text-white">{label}</Label>
    <div className="relative">
      <div className="absolute left-3 top-2.5 text-gray-400">{icon}</div>
      <Input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        required
        className="w-full bg-white/10 text-white placeholder-gray-400 border border-white/20 rounded-md pl-10 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-white/30"
      />
      {showToggle && (
        <button
          type="button"
          onClick={togglePassword}
          className="absolute right-3 top-2.5 text-xs text-gray-400 hover:text-white"
        >
          {type === 'password' ? 'Show' : 'Hide'}
        </button>
      )}
    </div>
    {error && <p className="text-sm text-red-500">{error}</p>}
  </div>
);

export default Signup;
