import React from 'react';
import { Search } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}

const SearchInput: React.FC<SearchInputProps> = ({ value, onChange, placeholder, className }) => (
  <div className={`relative flex-1 max-w-md ${className ?? ''}`}>
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-coral focus:border-transparent"
    />
  </div>
);

export default SearchInput;
