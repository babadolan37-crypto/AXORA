import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

interface HiddenValueProps {
  value: number;
  prefix?: string;
  className?: string;
}

export const HiddenValue = ({ value, prefix = 'Rp', className = '' }: HiddenValueProps) => {
  const [isVisible, setIsVisible] = useState(false);
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span>
        {isVisible ? formatCurrency(value) : `${prefix} ••••••••`}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsVisible(!isVisible);
        }}
        className="text-white/70 hover:text-white transition-colors"
        title={isVisible ? "Sembunyikan" : "Tampilkan"}
      >
        {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
};

export const HiddenValueDark = ({ value, prefix = 'Rp', className = '' }: HiddenValueProps) => {
  const [isVisible, setIsVisible] = useState(false);
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span>
        {isVisible ? formatCurrency(value) : `${prefix} ••••••••`}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsVisible(!isVisible);
        }}
        className="text-gray-400 hover:text-gray-600 transition-colors"
        title={isVisible ? "Sembunyikan" : "Tampilkan"}
      >
        {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
};
