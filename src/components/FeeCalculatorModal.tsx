import React, { useState } from 'react';
import { X, Calculator, Clock, Calendar, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { Carpark, LotType } from '../types/carpark';
import { estimateParkingFee } from '../services/carparkService';

interface FeeCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  carparks: Carpark[];
  initialCarpark?: Carpark | null;
}

export const FeeCalculatorModal: React.FC<FeeCalculatorModalProps> = ({
  isOpen,
  onClose,
  carparks,
  initialCarpark,
}) => {
  const [selectedCarparkId, setSelectedCarparkId] = useState<string>(
    initialCarpark?.id || carparks[0]?.id || ''
  );
  const [durationHours, setDurationHours] = useState<number>(2);
  const [durationMins, setDurationMins] = useState<number>(30);
  const [vehicleType, setVehicleType] = useState<LotType>('C');
  const [isSundayOrPH, setIsSundayOrPH] = useState<boolean>(false);

  if (!isOpen) return null;

  const selectedCarpark =
    carparks.find((c) => c.id === selectedCarparkId) || carparks[0];

  const totalMinutes = durationHours * 60 + durationMins;
  const calculation = selectedCarpark
    ? estimateParkingFee(selectedCarpark, totalMinutes, isSundayOrPH, vehicleType)
    : { totalFee: 0, breakdown: '', isGracePeriod: false };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Singapore Parking Fee Calculator
              </h3>
              <p className="text-xs text-slate-500">
                Estimate official HDB, URA & Mall parking costs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-4">
          {/* Carpark Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Select Carpark:
            </label>
            <select
              value={selectedCarparkId}
              onChange={(e) => setSelectedCarparkId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {carparks.map((cp) => (
                <option key={cp.id} value={cp.id}>
                  [{cp.agency}] {cp.name} ({cp.area}) — ${cp.rates.estimatedPerHourRate.toFixed(2)}/hr
                </option>
              ))}
            </select>
          </div>

          {/* Vehicle Type Switch */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Vehicle Type:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setVehicleType('C')}
                className={`py-2 text-xs font-semibold rounded-lg border transition-colors ${
                  vehicleType === 'C'
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Motorcar (C)
              </button>
              <button
                type="button"
                onClick={() => setVehicleType('Y')}
                className={`py-2 text-xs font-semibold rounded-lg border transition-colors ${
                  vehicleType === 'Y'
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Motorcycle (Y)
              </button>
              <button
                type="button"
                onClick={() => setVehicleType('H')}
                className={`py-2 text-xs font-semibold rounded-lg border transition-colors ${
                  vehicleType === 'H'
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Heavy Vehicle (H)
              </button>
            </div>
          </div>

          {/* Duration Inputs */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Parking Duration:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] text-slate-500 block mb-1">Hours</span>
                <select
                  value={durationHours}
                  onChange={(e) => setDurationHours(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                >
                  {[0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 24].map((h) => (
                    <option key={h} value={h}>
                      {h} hour{h === 1 ? '' : 's'}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block mb-1">Minutes</span>
                <select
                  value={durationMins}
                  onChange={(e) => setDurationMins(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                >
                  {[0, 10, 15, 30, 45].map((m) => (
                    <option key={m} value={m}>
                      {m} minutes
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Sunday / PH toggle */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div>
              <div className="text-xs font-semibold text-slate-800">Sunday or Public Holiday</div>
              <div className="text-[11px] text-slate-500">Includes Free Parking Schemes where applicable</div>
            </div>
            <input
              type="checkbox"
              checked={isSundayOrPH}
              onChange={(e) => setIsSundayOrPH(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
            />
          </div>

          {/* Calculation Result Hero Box */}
          <div className="p-4 rounded-xl bg-slate-900 text-white space-y-1">
            <div className="text-xs text-slate-400 font-medium">Estimated Parking Cost</div>
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-bold font-mono text-white">
                ${calculation.totalFee.toFixed(2)} SGD
              </div>
              {calculation.isGracePeriod && (
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Grace Period Active
                </span>
              )}
            </div>
            <div className="text-xs text-slate-300 pt-1 border-t border-slate-800">
              {calculation.breakdown}
            </div>
          </div>

          {/* Quick Informational Tip */}
          <div className="flex items-start gap-2 text-xs text-slate-500 bg-blue-50/50 p-2.5 rounded-lg border border-blue-100">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span>
              All charges are deducted via In-Vehicle Unit (IU) or Parking.sg coupon app. Grace periods generally cover pick-up/drop-off within 10–15 mins.
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
