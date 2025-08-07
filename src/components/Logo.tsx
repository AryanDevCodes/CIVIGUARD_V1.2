
import React from 'react';
import { Shield } from 'lucide-react';

interface LogoProps {
  className?: string;
}

const Logo = ({ className }: LogoProps) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative w-8 h-8 flex items-center justify-center">
        <Shield size={32} className="text-white fill-primary/30" />
      </div>
      <span className="font-semibold text-xl tracking-tight text-white">
        CIVI<span className="text-secondary font-bold">GUARD</span>
      </span>
    </div>
  );
};

export default Logo;
