import React, { useState } from 'react';
import { X, Delete, CupSoda, Lock, Key } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const PinLoginModal: React.FC = () => {
  const { isPinModalOpen, setIsPinModalOpen, employees, loginWithPin } = useApp();
  
  const [selectedEmpId, setSelectedEmpId] = useState<string>(employees[0]?.id || '');
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState('');

  if (!isPinModalOpen) return null;

  const currentEmp = employees.find(e => e.id === selectedEmpId) || employees[0];

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      setError('');

      if (nextPin.length === 4) {
        setTimeout(() => {
          const success = loginWithPin(nextPin, currentEmp.id);
          if (!success) {
            setError(`Incorrect PIN. Try PIN: ${currentEmp.pin}`);
            setPin('');
          }
        }, 150);
      }
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleLogin = () => {
    if (pin.length < 4) {
      setError('Please enter complete 4-digit PIN');
      return;
    }
    const success = loginWithPin(pin, currentEmp.id);
    if (!success) {
      setError(`Incorrect PIN. Try PIN: ${currentEmp.pin}`);
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-gray-100 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 relative">
        <button 
          onClick={() => setIsPinModalOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 text-gray-400"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center space-y-1">
          <div className="w-10 h-10 mx-auto rounded-full bg-emerald-800 text-amber-300 flex items-center justify-center shadow-xs">
            <CupSoda className="w-5 h-5 text-amber-300" />
          </div>
          <h3 className="font-extrabold text-base text-gray-900 font-serif">Quick PIN Switch</h3>
          <p className="text-xs text-gray-500">Select employee and enter 4-digit PIN</p>
        </div>

        {/* PIN Info Banner */}
        <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-950 font-medium space-y-1">
          <div className="flex items-center gap-1 font-bold text-amber-900 text-[11px]">
            <Key className="w-3.5 h-3.5 text-amber-600" /> Employee PIN Directory:
          </div>
          <div className="flex flex-wrap gap-2 text-[10px]">
            {employees.map(e => (
              <span key={e.id} className="bg-amber-100/80 px-2 py-0.5 rounded-md font-mono">
                <strong>{e.name.split(' ')[0]} ({e.role})</strong>: PIN <span className="font-bold text-amber-900">{e.pin}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Employee Picker */}
        <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
          <img
            src={currentEmp.photo}
            alt={currentEmp.name}
            className="w-12 h-12 rounded-full object-cover ring-2 ring-emerald-400"
          />
          <div className="flex-1 min-w-0">
            <select
              value={selectedEmpId}
              onChange={(e) => {
                setSelectedEmpId(e.target.value);
                setPin('');
                setError('');
              }}
              className="w-full bg-transparent text-xs font-bold text-gray-900 focus:outline-none cursor-pointer"
            >
              {employees.map(e => (
                <option key={e.id} value={e.id}>{e.name} ({e.role}) - PIN: {e.pin}</option>
              ))}
            </select>
            <p className="text-[10px] text-emerald-800 font-semibold mt-0.5">Role: {currentEmp.role} • PIN: {currentEmp.pin}</p>
          </div>
        </div>

        {/* PIN Dots */}
        <div className="flex justify-center gap-4 py-1">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full border-2 transition-all ${
                pin.length > idx
                  ? 'bg-amber-500 border-amber-600 scale-110 shadow-2xs'
                  : 'bg-gray-100 border-gray-300'
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-center text-xs font-bold text-red-600 animate-bounce">{error}</p>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-2.5 pt-1">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeyPress(num)}
              className="h-11 bg-gray-50 hover:bg-amber-100 text-gray-900 font-extrabold text-lg rounded-2xl border border-gray-100 shadow-2xs hover:shadow-xs transition-all active:scale-95"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={handleDelete}
            className="h-11 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-2xl flex items-center justify-center transition-all active:scale-95"
            title="Delete"
          >
            <Delete className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="h-11 bg-gray-50 hover:bg-amber-100 text-gray-900 font-extrabold text-lg rounded-2xl border border-gray-100 shadow-2xs hover:shadow-xs transition-all active:scale-95"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleLogin}
            className="h-11 bg-amber-400 hover:bg-amber-500 text-amber-950 font-extrabold text-xs rounded-2xl flex items-center justify-center gap-1 shadow-md hover:shadow-lg transition-all active:scale-95"
          >
            <Lock className="w-4 h-4" /> Switch
          </button>
        </div>
      </div>
    </div>
  );
};
