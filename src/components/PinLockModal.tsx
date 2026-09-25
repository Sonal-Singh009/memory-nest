import React, { useState } from 'react';
import { Lock, Unlock, AlertCircle } from 'lucide-react';

interface PinLockModalProps {
  correctPin: string;
  appName: string;
  onUnlock: () => void;
}

export const PinLockModal: React.FC<PinLockModalProps> = ({
  correctPin,
  appName,
  onUnlock,
}) => {
  const [enteredPin, setEnteredPin] = useState('');
  const [error, setError] = useState(false);

  const handleDigit = (digit: string) => {
    if (enteredPin.length >= 4) return;
    const next = enteredPin + digit;
    setEnteredPin(next);
    setError(false);

    if (next.length === 4) {
      if (next === correctPin) {
        onUnlock();
      } else {
        setError(true);
        setTimeout(() => {
          setEnteredPin('');
        }, 500);
      }
    }
  };

  const handleBackspace = () => {
    setEnteredPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#FAF8F5] p-4 text-[#2D2A26] select-none">
      <div className="w-full max-w-xs text-center space-y-7 animate-in fade-in zoom-in-95 duration-200">
        <div className="space-y-2">
          <div className="w-14 h-14 rounded-full bg-[#F4EDE2] border border-[#E8DFC8] flex items-center justify-center mx-auto text-[#9C5237]">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="font-serif text-2xl font-semibold text-[#3D2C1E]">{appName}</h2>
          <p className="text-xs text-[#7D6B5A]">Your memory vault is locked</p>
        </div>

        {/* PIN Dots */}
        <div className="flex justify-center items-center gap-4">
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = idx < enteredPin.length;
            return (
              <span
                key={idx}
                className={`w-3.5 h-3.5 rounded-full border transition-all duration-200 ${
                  error
                    ? 'border-[#9C3737] bg-[#9C3737] scale-110'
                    : isFilled
                    ? 'border-[#9C5237] bg-[#9C5237] scale-110'
                    : 'border-[#D9CDBE] bg-transparent'
                }`}
              />
            );
          })}
        </div>

        {error && (
          <p className="text-xs text-[#9C3737] font-medium flex items-center justify-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            Incorrect PIN code. Try again.
          </p>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              className="w-16 h-16 rounded-2xl bg-[#FFFDF9] hover:bg-[#F4ECE1] active:scale-95 border border-[#EAE0D3] font-serif text-2xl text-[#3D2C1E] font-medium transition flex items-center justify-center shadow-2xs cursor-pointer"
            >
              {digit}
            </button>
          ))}
          <div className="w-16 h-16" />
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="w-16 h-16 rounded-2xl bg-[#FFFDF9] hover:bg-[#F4ECE1] active:scale-95 border border-[#EAE0D3] font-serif text-2xl text-[#3D2C1E] font-medium transition flex items-center justify-center shadow-2xs cursor-pointer"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="w-16 h-16 rounded-2xl hover:bg-[#F4ECE1] active:scale-95 text-xs text-[#7D6B5A] font-medium transition flex items-center justify-center cursor-pointer"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};
