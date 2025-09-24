import React, { useState, useMemo, useEffect } from 'react';
import { db } from '../firebaseClient';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, runTransaction, where, query, getDocs } from 'firebase/firestore';
import { Devotee, LampRegistration, PuduRegistration, LampType, Transaction, Page } from '../types';
import { Modal } from '../components/Modal';
import { ServiceRegistrationModal } from '../components/ServiceRegistrationModal';

// Helper to convert Firestore doc to our type, including the ID
const fromFirestore = <T extends { id: string }>(doc: any): T => {
    const data = doc.data();
    return { ...data, id: doc.id } as T;
};

const DevoteeDetailModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    devotee: Devotee | null;
}> = ({ isOpen, onClose, devotee }) => {
    const [devoteeServices, setDevoteeServices] = useState<any[]>([]);

    useEffect(() => {
        if (!isOpen || !devotee) return;

        const fetchServices = async () => {
            if (!devotee) return;

            const transQuery = query(collection(db, 'transactions'), where('devoteeId', '==', devotee.id));
            const transSnapshot = await getDocs(transQuery);
            const transactions = transSnapshot.docs.map(fromFirestore);

            const services = transactions.map(t => ({
                type: t.category === 'service' ? '服務捐款' : '一般捐款',
                date: t.date,
                description: t.description,
                amount: t.amount
            })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            setDevoteeServices(services);
        };

        fetchServices();
    }, [isOpen, devotee]);

    if (!isOpen || !devotee) return null;

    const currencyFormatter = new Intl.NumberFormat('zh-TW', {
        style: 'currency',
        currency: 'TWD',
        minimumFractionDigits: 0,
    });

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`${devotee.name} 的詳細資料`}>
            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-semibold border-b pb-2 mb-2 dark:border-slate-600">基本資料</h3>
                    {/* ... basic info fields ... */}
                </div>
                <div>
                    <h3 className="text-lg font-semibold border-b pb-2 mb-2 dark:border-slate-600">歷史服務紀錄</h3>
                    {/* ... history table ... */}
                </div>
                 <div className="flex justify-end pt-4">
                    <button onClick={onClose} className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2 px-4 rounded-lg transition duration-300">關閉</button>
                </div>
            </div>
        </Modal>
    );
};

export const Devotees: React.FC<{ setActivePage: (page: Page) => void; }> = ({ setActivePage }) => {
    const [devotees, setDevotees] = useState<Devotee[]>([]);
    const [lampRegistrations, setLampRegistrations] = useState<LampRegistration[]>([]);

    useEffect(() => {
        const unsubscribeDevotees = onSnapshot(collection(db, 'devotees'), (snapshot) => {
            setDevotees(snapshot.docs.map(fromFirestore<Devotee>));
        });
        const unsubscribeLamps = onSnapshot(collection(db, 'lampRegistrations'), (snapshot) => {
            setLampRegistrations(snapshot.docs.map(fromFirestore<LampRegistration>));
        });
        return () => {
            unsubscribeDevotees();
            unsubscribeLamps();
        };
    }, []);

    const [isDevoteeModalOpen, setDevoteeModalOpen] = useState(false);
    const [isServiceModalOpen, setServiceModalOpen] = useState(false);
    const [isDetailModalOpen, setDetailModalOpen] = useState(false);
    
    const [currentDevotee, setCurrentDevotee] = useState<Partial<Devotee>>({});
    const [selectedDevotee, setSelectedDevotee] = useState<Devotee | null>(null);
    const [serviceType, setServiceType] = useState<'lamp' | 'pudu' | null>(null);
    const [initialServiceData, setInitialServiceData] = useState<Partial<LampRegistration & PuduRegistration>>({});
    const [searchTerm, setSearchTerm] = useState('');

    const filteredDevotees = useMemo(() => {
        return devotees
            .filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()) || (d.phone && d.phone.includes(searchTerm)))
            .sort((a, b) => new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime());
    }, [devotees, searchTerm]);

    const handleOpenDevoteeModal = (devotee?: Devotee) => {
        setCurrentDevotee(devotee || { registrationDate: new Date().toISOString().split('T')[0] });
        setDevoteeModalOpen(true);
    };

    const handleSaveDevotee = async () => {
        if (!currentDevotee.name) return;
        try {
            if (currentDevotee.id) {
                const { id, ...dataToUpdate } = currentDevotee;
                await updateDoc(doc(db, 'devotees', id), dataToUpdate);
            } else {
                await addDoc(collection(db, 'devotees'), currentDevotee);
            }
            setDevoteeModalOpen(false);
        } catch (error) {
            console.error("Error saving devotee: ", error);
            alert("儲存信眾資料失敗！");
        }
    };

    const handleOpenServiceModal = (devotee: Devotee, type: 'lamp' | 'pudu') => {
        setSelectedDevotee(devotee);
        setServiceType(type);
        // ... logic to set initial service data ...
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
            setSelectedDevotee(null);
        } catch (error) {
            console.error("Error saving service: ", error);
            alert("登記服務失敗！");
        }
    };

    // ... other handlers ...

    return (
        <div className="space-y-6">
            {/* ... main JSX for devotee list ... */}
            <ServiceRegistrationModal
              isOpen={isServiceModalOpen}
              onClose={() => { setServiceModalOpen(false); setSelectedDevotee(null); }}
              serviceType={serviceType}
              onSave={handleSaveService}
              devotees={devotees}
              initialData={initialServiceData}
              initialDevoteeId={selectedDevotee?.id}
            />
            {/* ... other modals ... */}
        </div>
    );
};