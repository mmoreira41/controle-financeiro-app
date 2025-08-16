import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus } from 'lucide-react';

interface Option {
  value: string;
  label: React.ReactNode;
}

interface MobileSelectorProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  allLabel: React.ReactNode;
  allValue?: string;
  onAddNew?: () => void;
  addNewLabel?: string;
}

const MobileSelector: React.FC<MobileSelectorProps> = ({ options, value, onChange, allLabel, allValue = 'all', onAddNew, addNewLabel }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);
  const displayLabel = selectedOption ? selectedOption.label : allLabel;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);
  
  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    setIsOpen(false);
  };

  const handleAddNew = () => {
    if(onAddNew) {
        onAddNew();
    }
    setIsOpen(false);
  }

  return (
    <div className="relative md:hidden" ref={wrapperRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center bg-gray-700/80 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg shadow-md transition-colors"
      >
        <div className="text-left">{displayLabel}</div>
        <ChevronDown size={20} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} flex-shrink-0 ml-2`} />
      </button>

      {isOpen && (
        <div className="absolute z-10 top-full mt-2 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden animate-fade-in-down">
          <ul className="max-h-60 overflow-y-auto">
            <li>
              <button
                onClick={() => handleSelect(allValue)}
                className="w-full text-left px-4 py-3 text-white font-bold bg-gray-900/50 hover:bg-green-500/20 transition-colors"
              >
                {allLabel}
              </button>
            </li>
            {options.map(option => (
              <li key={option.value}>
                <button
                  onClick={() => handleSelect(option.value)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-700 transition-colors ${value === option.value ? 'bg-gray-700/50' : 'text-gray-200'}`}
                >
                  {option.label}
                </button>
              </li>
            ))}
            {onAddNew && addNewLabel && (
              <li className="border-t border-gray-700/50">
                <button
                  onClick={handleAddNew}
                  className="w-full text-left px-4 py-3 text-green-400 hover:bg-green-500/20 transition-colors flex items-center space-x-3 font-semibold"
                >
                  <Plus size={18} />
                  <span>{addNewLabel}</span>
                </button>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MobileSelector;