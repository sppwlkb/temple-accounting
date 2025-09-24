import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { LampType, LampRegistration, PuduRegistration, Devotee } from '../types';

export const ServiceRegistrationModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    serviceType: 'lamp' | 'pudu' | null;
    onSave: (amount: number, description: string, serviceData: any, devoteeId: string, devoteeName: string) => void;
    devotees: Devotee[]; // Now accepts the full list of devotees
    initialData: Partial<LampRegistration & PuduRegistration>;
    initialDevoteeId?: string; // Optional initial devotee
}> = ({ isOpen, onClose, serviceType, onSave, devotees, initialData, initialDevoteeId }) => {
    const [amount, setAmount] = useState(0);
    const [year, setYear] = useState(new Date().getFullYear());
    const [lampType, setLampType] = useState<LampType>(LampType.Guangming);
    const [puduPackage, setPuduPackage] = useState('標準方案');
    const [selectedDevoteeId, setSelectedDevoteeId] = useState<string>('');

    useEffect(() => {
        if (isOpen) {
            setAmount(0);
            setSelectedDevoteeId(initialDevoteeId || '');
            if (serviceType === 'lamp') {
                setYear(initialData.year || new Date().getFullYear());
                setLampType(initialData.lampType || LampType.Guangming);
            } else if (serviceType === 'pudu') {
                setYear(initialData.year || new Date().getFullYear());
                setPuduPackage('標準方案');
            }
        }
    }, [isOpen, serviceType, initialData, initialDevoteeId]);

    const handleSave = () => {
        const selectedDevotee = devotees.find(d => d.id === selectedDevoteeId);
        if (!selectedDevotee) {
            alert('請選擇一位信眾');
            return;
        }

        if (serviceType === 'lamp') {
            onSave(amount, `${year} ${lampType}`, { lampType, year }, selectedDevotee.id, selectedDevotee.name);
        } else {
            onSave(amount, `${year} 中元普渡 - ${puduPackage}`, { package: puduPackage, year }, selectedDevotee.id, selectedDevotee.name);
        }
    };
    
    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`登記服務`}>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium">為哪位信眾登記？</label>
                    <select 
                        value={selectedDevoteeId}
                        onChange={e => setSelectedDevoteeId(e.target.value)}
                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm dark:bg-slate-700 dark:border-slate-600"
                        disabled={!!initialDevoteeId} // Disable if a devotee is pre-selected
                    >
                        <option value="">-- 請選擇信眾 --</option>
                        {devotees.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                    </select>
                </div>

                {serviceType === 'lamp' && (
                    <>
                        <h4 className="font-semibold text-lg">登記點燈</h4>
                        {/* ... lamp fields ... */}
                    </>
                )}
                {serviceType === 'pudu' && (
                     <>
                        <h4 className="font-semibold text-lg">登記中元普渡</h4>
                        {/* ... pudu fields ... */}
                    </>
                )}
                <div>
                    <label className="block text-sm font-medium">金額</label>
                    <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm dark:bg-slate-700 dark:border-slate-600" />
                </div>
                 <div className="flex justify-end space-x-2 pt-4">
                    <button onClick={onClose} className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2 px-4 rounded-lg transition duration-300">取消</button>
                    <button onClick={handleSave} className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300">儲存並建立帳目</button>
                </div>
            </div>
        </Modal>
    );
};
