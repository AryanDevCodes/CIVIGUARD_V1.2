import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import Logo from "@/components/Logo";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  AlertDescription
} from "@/components/ui/alert";
import {
  AlertCircle,
  Lock,
  Mail
} from "lucide-react";
import { motion } from "framer-motion";

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleDemoLogin = (role: "citizen" | "officer" | "admin") => {
    const demoAccounts = {
      citizen: { email: "citizen1@civiguard.com", password: "citizen123" },
      officer: { email: "officer1@civiguard.com", password: "officer123" },
      admin: { email: "admin@civiguard.com", password: "adminPassword123" }
    };
    const creds = demoAccounts[role];
    setEmail(creds.email);
    setPassword(creds.password);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    try {
      await login(email, password);
      toast({
        title: 'Login successful',
        description: 'Welcome to CIVIGUARD'
      });
      navigate('/');
    } catch (err: any) {
      setError('Invalid email or password. Please try again.');
      toast({
        title: 'Login failed',
        description: 'Please check your email and password',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-neutral-900 to-zinc-800 p-6">
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="w-full max-w-md bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl shadow-lg p-8 space-y-6"
  >
    <div className="text-center">
      <Logo className="mx-auto mb-4 scale-110" />
      <h1 className="text-white text-2xl font-semibold">Welcome to CiviGuard</h1>
      <p className="text-gray-400 text-sm">Sign in to access your account</p>
    </div>

    {error && (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )}

    <form onSubmit={handleLogin} className="space-y-5">
      <div>
        <Label htmlFor="email" className="text-sm text-gray-200">Email</Label>
        <div className="relative mt-1">
          <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="pl-10 py-2 rounded-md bg-white/10 text-white border border-white/20 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/30"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="password" className="text-sm text-gray-200">Password</Label>
        <div className="relative mt-1">
          <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="pl-10 py-2 rounded-md bg-white/10 text-white border border-white/20 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/30"
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-white to-gray-300 text-black font-semibold py-2 rounded-md hover:from-gray-200 hover:to-white transition"
      >
        {isLoading ? "Signing in..." : "Sign in"}
      </Button>

      <div className="text-center text-sm text-gray-400 mt-4">
        Demo Accounts
      </div>

      <div className="flex justify-between gap-2">
        {["Citizen", "Officer", "Admin"].map((role) => (
          <Button
            key={role}
            variant="ghost"
            onClick={() => handleDemoLogin(role.toLowerCase() as any)}
            className="w-full text-white border border-white/20 hover:bg-white/10"
          >
            {role}
          </Button>
        ))}
      </div>

      <div className="text-center">
        <Button
          type="button"
          variant="link"
          className="text-sm text-gray-300 hover:underline"
          onClick={() => navigate("/signup")}
        >
          New user? Create an account
        </Button>
      </div>
    </form>
  </motion.div>
</div>
  );
};

export default Login;
