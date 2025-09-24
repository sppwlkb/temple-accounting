
import React from 'react';
import { ReceiptData } from '../types';
import { ORGANIZATION_INFO } from '../constants';

interface ReceiptToPrintProps {
  receiptData: ReceiptData;
}

const ReceiptToPrint = React.forwardRef<HTMLDivElement, ReceiptToPrintProps>(({ receiptData }, ref) => {
  const { transaction, devotee } = receiptData;

  const toTaiwaneseDate = (date: Date) => {
    const year = date.getFullYear() - 1911;
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `中華民國 ${year} 年 ${month} 月 ${day} 日`;
  };
  
  const currencyFormatter = new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0,
  });

  return (
    <div ref={ref} className="p-8 bg-white text-black font-sans">
      <div className="border-4 border-double border-red-800 p-6">
        <header className="text-center mb-6">
          <h1 className="text-3xl font-bold text-red-800 tracking-wider">{ORGANIZATION_INFO.name}</h1>
          <h2 className="text-2xl font-semibold mt-2">捐款感謝收據</h2>
        </header>
        
        <div className="flex justify-between items-end mb-4 text-sm">
          <div>
            <p>統一編號：{ORGANIZATION_INFO.taxId}</p>
          </div>
          <div>
            <p>收據編號：{transaction.id.substring(0, 8)}</p>
            <p>開立日期：{toTaiwaneseDate(new Date(transaction.date))}</p>
          </div>
        </div>
        
        <table className="w-full border-collapse border border-gray-400">
          <tbody>
            <tr>
              <td className="border border-gray-400 p-2 w-1/5 bg-gray-100 font-semibold">捐款信眾</td>
              <td className="border border-gray-400 p-2" colSpan={3}>{devotee?.name || '現場功德主'}</td>
            </tr>
            <tr>
              <td className="border border-gray-400 p-2 bg-gray-100 font-semibold">捐款事由</td>
              <td className="border border-gray-400 p-2" colSpan={3}>{transaction.description}</td>
            </tr>
            <tr>
              <td className="border border-gray-400 p-2 bg-gray-100 font-semibold">捐款金額</td>
              <td className="border border-gray-400 p-2 font-mono text-lg" colSpan={3}>
                {currencyFormatter.format(transaction.amount)}
              </td>
            </tr>
            <tr>
              <td className="border border-gray-400 p-2 h-20 align-top bg-gray-100 font-semibold">備註</td>
              <td className="border border-gray-400 p-2" colSpan={3}>
                此收據可做為抵稅證明。
              </td>
            </tr>
          </tbody>
        </table>
        
        <footer className="mt-8 text-xs text-gray-600">
          <div className="flex justify-between">
            <div>
              <p>負責人：{ORGANIZATION_INFO.personInCharge}</p>
              <p>聯絡人：{ORGANIZATION_INFO.contactPerson}</p>
              <p>電話：{ORGANIZATION_INFO.phone}</p>
            </div>
            <div className="text-right">
              <p>地址：{ORGANIZATION_INFO.address}</p>
              <p>Email：{ORGANIZATION_INFO.email}</p>
            </div>
            <div className="flex flex-col items-center justify-center">
                <p className="font-semibold">會章</p>
                <div className="w-20 h-20 border-2 border-red-700 mt-1 flex items-center justify-center text-red-700 text-xs">(印章處)</div>
            </div>
          </div>
          <p className="text-center mt-4">感謝您的善心捐助，功德無量！</p>
        </footer>
      </div>
    </div>
  );
});

export default ReceiptToPrint;
