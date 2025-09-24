import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebaseClient';
import { collection, onSnapshot, addDoc, doc, runTransaction } from 'firebase/firestore';
import { Devotee, LampRegistration, PuduRegistration, Transaction, Page, LampType } from '../types';
import { ServiceRegistrationModal } from '../components/ServiceRegistrationModal';

// Helper to convert Firestore doc to our type, including the ID
const fromFirestore = <T extends { id: string }>(doc: any): T => {
    const data = doc.data();
    return { ...data, id: doc.id } as T;
};

export const Services: React.FC = () => {
    const [devotees, setDevotees] = useState<Devotee[]>([]);
    const [lampRegistrations, setLampRegistrations] = useState<LampRegistration[]>([]);
    const [puduRegistrations, setPuduRegistrations] = useState<PuduRegistration[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    const [isServiceModalOpen, setServiceModalOpen] = useState(false);
    const [serviceType, setServiceType] = useState<'lamp' | 'pudu' | null>(null);
    const [initialServiceData, setInitialServiceData] = useState<Partial<LampRegistration & PuduRegistration>>({});

    useEffect(() => {
        const unsubDevotees = onSnapshot(collection(db, 'devotees'), (snap) => {
            setDevotees(snap.docs.map(fromFirestore<Devotee>));
        });
        const unsubLamps = onSnapshot(collection(db, 'lampRegistrations'), (snap) => {
            setLampRegistrations(snap.docs.map(fromFirestore<LampRegistration>));
        });
        const unsubPudu = onSnapshot(collection(db, 'puduRegistrations'), (snap) => {
            setPuduRegistrations(snap.docs.map(fromFirestore<PuduRegistration>));
        });

        return () => {
            unsubDevotees();
            unsubLamps();
            unsubPudu();
        };
    }, []);

    const allServices = useMemo(() => {
        const devoteeMap = new Map(devotees.map(d => [d.id, d.name]));
        const lamps = lampRegistrations.map(l => ({ id: l.id, date: l.paymentDate, devoteeName: devoteeMap.get(l.devoteeId) || 'N/A', serviceType: '點燈服務', description: `${l.year} ${l.lampType}`, amount: l.amount }));
        const pudus = puduRegistrations.map(p => ({ id: p.id, date: p.paymentDate, devoteeName: devoteeMap.get(p.devoteeId) || 'N/A', serviceType: '普渡服務', description: `${p.year} ${p.package}`, amount: p.amount }));
        return [...lamps, ...pudus].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [devotees, lampRegistrations, puduRegistrations]);

    const filteredServices = useMemo(() => {
        return allServices.filter(s => 
            s.devoteeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.serviceType.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [allServices, searchTerm]);

    const handleOpenServiceModal = (type: 'lamp' | 'pudu') => {
        setServiceType(type);
        setInitialServiceData({ year: new Date().getFullYear() });
        setServiceModalOpen(true);
    };

    const handleSaveService = async (amount: number, description: string, serviceData: any, devoteeId: string, devoteeName: string) => {
        try {
            await runTransaction(db, async (transaction) => {
                const transRef = doc(collection(db, 'transactions'));
                transaction.set(transRef, { date: new Date().toISOString().split('T')[0], amount, description: `${devoteeName} - ${description}`, devoteeId, category: 'service' });

                const serviceCollection = serviceType === 'lamp' ? 'lampRegistrations' : 'puduRegistrations';
                const serviceRef = doc(collection(db, serviceCollection));
                transaction.set(serviceRef, { ...serviceData, devoteeId, paymentDate: new Date().toISOString().split('T')[0], amount });
            });
            setServiceModalOpen(false);
        } catch (error) {
            console.error("Error saving service: ", error);
            alert("登記服務失敗！");
        }
    };

    const currencyFormatter = new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', minimumFractionDigits: 0 });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-2">
                <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">服務項目管理</h1>
                <div className="flex items-center gap-2">
                    <button onClick={() => handleOpenServiceModal('lamp')} className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300">登記點燈</button>
                    <button onClick={() => handleOpenServiceModal('pudu')} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300">登記普渡</button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
                {/* ... search and table JSX ... */}
            </div>
            <ServiceRegistrationModal
                isOpen={isServiceModalOpen}
                onClose={() => setServiceModalOpen(false)}
                serviceType={serviceType}
                onSave={handleSaveService}
                devotees={devotees}
                initialData={initialServiceData}
            />
        </div>
    );
};