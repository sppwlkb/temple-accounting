import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebaseClient';
import { collection, onSnapshot } from 'firebase/firestore';
import { Transaction, Devotee, LampRegistration, TransactionType, Page } from '../types';

// Helper to convert Firestore doc to our type, including the ID
const fromFirestore = <T extends { id: string }>(doc: any): T => {
    const data = doc.data();
    return { ...data, id: doc.id } as T;
};

interface DashboardProps {
    setActivePage: (page: Page) => void;
}

const StatCard: React.FC<{ title: string; value: string | number; icon: JSX.Element, color: string }> = ({ title, value, icon, color }) => (
  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 flex items-center space-x-4 transition hover:scale-105 duration-300">
    <div className={`rounded-full p-3 ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{title}</p>
      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
    </div>
  </div>
);

const TaisuiReminder: React.FC<{ setActivePage: (page: Page) => void; }> = ({ setActivePage }) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const targetYear = currentMonth >= 10 ? currentYear + 1 : currentYear;

    if (currentMonth > 0 && currentMonth < 10) {
        return null;
    }
    
    return (
        <div className="bg-amber-100 dark:bg-amber-900/50 border-l-4 border-amber-500 text-amber-700 dark:text-amber-300 p-4 rounded-lg shadow-md" role="alert">
            <div className="flex items-start">
                <div className="py-1">
                    <svg className="fill-current h-6 w-6 text-amber-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-9a1 1 0 011-1h2a1 1 0 110 2h-1v4h1a1 1 0 110 2h-2a1 1 0 01-1-1v-5z"/></svg>
                </div>
                <div>
                    <p className="font-bold">年度太歲燈登記提醒</p>
                    <p className="text-sm">請記得提醒信眾登記 {targetYear} 年度的太歲燈。</p>
                    <button
                        onClick={() => setActivePage(Page.Devotees)}
                        className="mt-2 text-sm font-semibold text-amber-800 dark:text-amber-200 hover:underline bg-amber-200 dark:bg-amber-800/50 px-3 py-1 rounded-md transition-colors"
                    >
                        前往信眾管理登記 &rarr;
                    </button>
                </div>
            </div>
        </div>
    );
};

export const Dashboard: React.FC<DashboardProps> = ({ setActivePage }) => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [devotees, setDevotees] = useState<Devotee[]>([]);
    const [lampRegistrations, setLampRegistrations] = useState<LampRegistration[]>([]);

    useEffect(() => {
        const unsubTransactions = onSnapshot(collection(db, 'transactions'), (snap) => {
            setTransactions(snap.docs.map(fromFirestore<Transaction>));
        });
        const unsubDevotees = onSnapshot(collection(db, 'devotees'), (snap) => {
            setDevotees(snap.docs.map(fromFirestore<Devotee>));
        });
        const unsubLamps = onSnapshot(collection(db, 'lampRegistrations'), (snap) => {
            setLampRegistrations(snap.docs.map(fromFirestore<LampRegistration>));
        });

        return () => {
            unsubTransactions();
            unsubDevotees();
            unsubLamps();
        };
    }, []);

    const stats = useMemo(() => {
        const thisMonthIncome = transactions
            .filter(t => {
                const transactionDate = new Date(t.date);
                const currentMonth = new Date().getMonth();
                const currentYear = new Date().getFullYear();
                return t.type === TransactionType.Income && 
                       transactionDate.getMonth() === currentMonth && 
                       transactionDate.getFullYear() === currentYear;
            })
            .reduce((sum, t) => sum + t.amount, 0);

        const currentYear = new Date().getFullYear();
        const activeLamps = lampRegistrations.filter(l => l.year === currentYear).length;

        const recentIncome = transactions
            .filter(t => t.type === TransactionType.Income)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5);

        return { thisMonthIncome, devoteeCount: devotees.length, activeLamps, recentIncome };
    }, [transactions, devotees, lampRegistrations]);

    const currencyFormatter = new Intl.NumberFormat('zh-TW', {
        style: 'currency',
        currency: 'TWD',
        minimumFractionDigits: 0,
    });

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">儀表板</h1>
            <TaisuiReminder setActivePage={setActivePage} />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard 
                    title="本月功德金" 
                    value={currencyFormatter.format(stats.thisMonthIncome)} 
                    color="bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>}
                />
                <StatCard 
                    title="總信眾人數" 
                    value={stats.devoteeCount} 
                    color="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.124-1.28-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.124-1.28.356-1.857m0 0a3.001 3.001 0 015.288 0M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                />
                <StatCard 
                    title="本年度點燈數" 
                    value={stats.activeLamps} 
                    color="bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>}
                />
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-100">近期功德款</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400">
                            <tr>
                                <th scope="col" className="px-6 py-3">日期</th>
                                <th scope="col" className="px-6 py-3">事由</th>
                                <th scope="col" className="px-6 py-3">金額</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.recentIncome.map(t => (
                                <tr key={t.id} className="bg-white border-b dark:bg-slate-800 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600">
                                    <td className="px-6 py-4">{new Date(t.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4">{t.description}</td>
                                    <td className="px-6 py-4 font-medium text-green-600 dark:text-green-400">{currencyFormatter.format(t.amount)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};