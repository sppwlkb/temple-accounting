import React, { useState, useMemo, useRef, useEffect } from 'react';
import { db } from '../firebaseClient';
import { collection, onSnapshot, addDoc, updateDoc, doc } from 'firebase/firestore';
import { Transaction, TransactionType, Devotee, ReceiptData } from '../types';
import { Modal } from '../components/Modal';
import ReceiptToPrint from '../components/ReceiptToPrint';

// Helper to convert Firestore doc to our type, including the ID
const fromFirestore = <T extends { id: string }>(doc: any): T => {
    const data = doc.data();
    return { ...data, id: doc.id } as T;
};

const StatCard: React.FC<{ title: string; value: string; icon: JSX.Element, className?: string }> = ({ title, value, icon, className }) => (
  <div className={`bg-white dark:bg-slate-800 rounded-xl shadow p-4 flex items-center space-x-3 ${className}`}>
    <div className="rounded-full p-2 bg-slate-100 dark:bg-slate-700">
      {icon}
    </div>
    <div>
      <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{title}</p>
      <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{value}</p>
    </div>
  </div>
);

export const Accounting: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [devotees, setDevotees] = useState<Devotee[]>([]);
  const [isModalOpen, setModalOpen] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState<Partial<Transaction>>({});
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const componentToPrintRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      const unsubscribeTrans = onSnapshot(collection(db, 'transactions'), (snapshot) => {
          setTransactions(snapshot.docs.map(fromFirestore<Transaction>));
      });
      const unsubscribeDevotees = onSnapshot(collection(db, 'devotees'), (snapshot) => {
          setDevotees(snapshot.docs.map(fromFirestore<Devotee>));
      });
      return () => {
          unsubscribeTrans();
          unsubscribeDevotees();
      };
  }, []);

  // Manual print function
  const handlePrint = () => {
    const source = componentToPrintRef.current;
    if (!source) {
      console.error("Print source is not available.");
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
        console.error("Cannot access iframe document.");
        document.body.removeChild(iframe);
        return;
    }

    const styleAndLinkTags = document.querySelectorAll('head > style, head > link[rel="stylesheet"]');
    styleAndLinkTags.forEach(tag => {
      doc.head.appendChild(tag.cloneNode(true));
    });

    // Use cloneNode for a more robust copy
    doc.body.appendChild(source.cloneNode(true));

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      document.body.removeChild(iframe);
      setReceiptData(null); // Clean up after printing
    }, 1500);
  };

  useEffect(() => {
    if (isPrinting) {
      handlePrint();
      setIsPrinting(false);
    }
  }, [isPrinting]);

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(t => filter === 'all' || t.type === filter)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, filter]);
  
  const summary = useMemo(() => {
    const totalIncome = filteredTransactions
      .filter(t => t.type === TransactionType.Income)
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = filteredTransactions
      .filter(t => t.type === TransactionType.Expense)
      .reduce((sum, t) => sum + t.amount, 0);
    return {
      income: totalIncome,
      expense: totalExpense,
      net: totalIncome - totalExpense,
    };
  }, [filteredTransactions]);

  const handleOpenModal = (type: TransactionType) => {
    setCurrentTransaction({ date: new Date().toISOString().split('T')[0], type: type, category: '' });
    setModalOpen(true);
  };

  const handleSave = async () => {
      if (!currentTransaction.date || !currentTransaction.amount || !currentTransaction.description) {
          alert("日期、金額和事由為必填欄位。");
          return;
      }
      try {
        if (currentTransaction.id) {
            const { id, ...dataToUpdate } = currentTransaction;
            const docRef = doc(db, 'transactions', id);
            await updateDoc(docRef, dataToUpdate);
        } else {
            await addDoc(collection(db, 'transactions'), currentTransaction);
        }
        setModalOpen(false);
      } catch (error) {
          console.error("Error saving transaction: ", error);
          alert("儲存帳目失敗！");
      }
  };
  
  const handlePrepareAndPrint = (transaction: Transaction) => {
    const devotee = transaction.devoteeId ? devotees.find(d => d.id === transaction.devoteeId) || null : null;
    setReceiptData({ transaction, devotee });
    setIsPrinting(true);
  };

  const currencyFormatter = new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0,
  });

  return (
    <div className="space-y-6">
       {receiptData && (
        <div style={{ display: 'none' }}>
            <ReceiptToPrint ref={componentToPrintRef} receiptData={receiptData} />
        </div>
      )}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">會計帳務</h1>
        <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenModal(TransactionType.Income)}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300"
            >
              新增收入
            </button>
            <button
              onClick={() => handleOpenModal(TransactionType.Expense)}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300"
            >
              新增支出
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
              title="總收入"
              value={currencyFormatter.format(summary.income)}
              className="border-l-4 border-green-500"
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>}
          />
          <StatCard
              title="總支出"
              value={currencyFormatter.format(summary.expense)}
               className="border-l-4 border-red-500"
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" /></svg>}
          />
          <StatCard
              title="淨結餘"
              value={currencyFormatter.format(summary.net)}
               className="border-l-4 border-blue-500"
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 6-3 6m18-12-3 6 3 6" /></svg>}
          />
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
        <div className="mb-4">
          <div className="flex space-x-2">
            <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-amber-500 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>全部</button>
            <button onClick={() => setFilter('income')} className={`px-4 py-2 rounded-lg ${filter === 'income' ? 'bg-green-500 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>收入</button>
            <button onClick={() => setFilter('expense')} className={`px-4 py-2 rounded-lg ${filter === 'expense' ? 'bg-red-500 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>支出</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400">
              <tr>
                <th scope="col" className="px-6 py-3">日期</th>
                <th scope="col" className="px-6 py-3">類型</th>
                <th scope="col" className="px-6 py-3">事由/摘要</th>
                <th scope="col" className="px-6 py-3">信眾</th>
                <th scope="col" className="px-6 py-3 text-right">金額</th>
                <th scope="col" className="px-6 py-3 text-center">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map(t => (
                <tr key={t.id} className="bg-white border-b dark:bg-slate-800 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600">
                  <td className="px-6 py-4">{new Date(t.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${t.type === 'income' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'}`}>
                      {t.type === 'income' ? '收入' : '支出'}
                    </span>
                  </td>
                  <td className="px-6 py-4">{t.description}</td>
                   <td className="px-6 py-4">{t.devoteeId ? devotees.find(d => d.id === t.devoteeId)?.name : 'N/A'}</td>
                  <td className={`px-6 py-4 text-right font-medium ${t.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{currencyFormatter.format(t.amount)}</td>
                  <td className="px-6 py-4 text-center">
                    {t.type === 'income' && (
                       <button onClick={() => handlePrepareAndPrint(t)} className="font-medium text-blue-600 dark:text-blue-500 hover:underline">列印收據</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title={currentTransaction.id ? '編輯帳目' : '新增帳目'}>
        <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">日期</label>
              <input type="date" value={currentTransaction.date || ''} onChange={e => setCurrentTransaction({...currentTransaction, date: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">類型</label>
              <select value={currentTransaction.type || ''} onChange={e => setCurrentTransaction({...currentTransaction, type: e.target.value as TransactionType})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600">
                <option value={TransactionType.Income}>收入</option>
                <option value={TransactionType.Expense}>支出</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">金額</label>
              <input type="number" value={currentTransaction.amount || ''} onChange={e => setCurrentTransaction({...currentTransaction, amount: Number(e.target.value)})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600" />
            </div>
             <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">類別</label>
                <input type="text" value={currentTransaction.category || ''} onChange={e => setCurrentTransaction({...currentTransaction, category: e.target.value})} placeholder="例如：功德金、法會、雜項" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600" />
            </div>
             <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">關聯信眾 (可選)</label>
                <select value={currentTransaction.devoteeId || ''} onChange={e => setCurrentTransaction({...currentTransaction, devoteeId: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600">
                    <option value="">無</option>
                    {devotees.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">事由/摘要</label>
              <textarea value={currentTransaction.description || ''} onChange={e => setCurrentTransaction({...currentTransaction, description: e.target.value})} rows={3} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600"></textarea>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <button onClick={() => setModalOpen(false)} className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2 px-4 rounded-lg transition duration-300">取消</button>
              <button onClick={handleSave} className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300">儲存</button>
            </div>
        </div>
      </Modal>
    </div>
  );
};