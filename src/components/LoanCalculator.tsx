'use client'

import { useState, useEffect } from 'react';
import { Calculator, RefreshCcw } from 'lucide-react';

interface CalculatorProps {
    price: number;
    type: 'PROPERTY' | 'VEHICLE';
}

export default function LoanCalculator({ price, type }: CalculatorProps) {
    // Defaults based on Malaysia Market Standards
    const defaultDownPayment = 10; // 10%
    const defaultTenure = type === 'PROPERTY' ? 35 : 9; // 35 years vs 9 years
    const defaultInterest = type === 'PROPERTY' ? 4.2 : 3.0; // 4.2% vs 3.0%

    const [downPaymentPerc, setDownPaymentPerc] = useState(defaultDownPayment);
    const [tenure, setTenure] = useState(defaultTenure);
    const [interest, setInterest] = useState(defaultInterest);
    const [monthly, setMonthly] = useState(0);

    const calculate = () => {
        const principal = price - (price * (downPaymentPerc / 100));

        if (type === 'VEHICLE') {
            // --- CAR LOAN (Flat Rate) ---
            // Formula: (Principal + (Principal * Rate * Years)) / Months
            const totalInterest = principal * (interest / 100) * tenure;
            const totalPayable = principal + totalInterest;
            const months = tenure * 12;
            setMonthly(totalPayable / months);
        } else {
            // --- HOME LOAN (Reducing Balance / Amortization) ---
            // Formula: M = P [ i(1 + i)^n ] / [ (1 + i)^n – 1 ]
            const r = (interest / 100) / 12; // Monthly interest
            const n = tenure * 12; // Total months
            
            if (r === 0) {
                setMonthly(principal / n);
            } else {
                const emi = principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
                setMonthly(emi);
            }
        }
    };

    // Auto-calculate on load or change
    useEffect(() => {
        calculate();
    }, [downPaymentPerc, tenure, interest]);

    return (
        <div className="bg-neutral-900 border border-white/10 p-6 rounded-3xl">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-white">
                <Calculator size={20} className="text-blue-500"/> 
                {type === 'VEHICLE' ? 'Car Loan' : 'Mortgage'} Calculator
            </h3>

            <div className="space-y-6">
                
                {/* 1. Monthly Payment Display */}
                <div className="bg-black border border-white/10 rounded-2xl p-6 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-16 bg-blue-600/10 blur-3xl rounded-full"></div>
                    <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1 relative z-10">Est. Monthly Payment</p>
                    <p className="text-4xl font-bold text-white relative z-10 font-serif">
                        RM {monthly.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                </div>

                {/* 2. Sliders / Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Down Payment */}
                    <div>
                        <div className="flex justify-between text-xs mb-2">
                            <span className="text-gray-400">Down Payment</span>
                            <span className="text-white font-bold">{downPaymentPerc}%</span>
                        </div>
                        <input 
                            type="range" min="0" max="50" step="1"
                            value={downPaymentPerc}
                            onChange={(e) => setDownPaymentPerc(Number(e.target.value))}
                            className="w-full accent-blue-600 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                        <p className="text-[10px] text-gray-500 mt-1">
                            RM {(price * (downPaymentPerc/100)).toLocaleString()} upfront
                        </p>
                    </div>

                    {/* Tenure */}
                    <div>
                        <div className="flex justify-between text-xs mb-2">
                            <span className="text-gray-400">Loan Tenure</span>
                            <span className="text-white font-bold">{tenure} Years</span>
                        </div>
                        <input 
                            type="range" min="1" max={type === 'PROPERTY' ? 40 : 9} step="1"
                            value={tenure}
                            onChange={(e) => setTenure(Number(e.target.value))}
                            className="w-full accent-blue-600 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>

                    {/* Interest Rate */}
                    <div>
                        <div className="flex justify-between text-xs mb-2">
                            <span className="text-gray-400">Interest Rate</span>
                            <span className="text-white font-bold">{interest}%</span>
                        </div>
                        <input 
                            type="range" min="1" max="10" step="0.1"
                            value={interest}
                            onChange={(e) => setInterest(Number(e.target.value))}
                            className="w-full accent-blue-600 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>

                </div>

                <div className="text-[10px] text-gray-500 text-center italic">
                    * Disclaimer: This is an estimation. Actual rates depend on your credit score and bank offers.
                </div>
            </div>
        </div>
    );
}