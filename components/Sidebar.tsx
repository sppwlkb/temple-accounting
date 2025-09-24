
import React from 'react';
import { Page } from '../types';
import { ORGANIZATION_INFO } from '../constants';

interface SidebarProps {
  activePage: Page;
  setActivePage: (page: Page) => void;
  isSidebarOpen: boolean;
  setSidebarOpen: (isOpen: boolean) => void;
}

const NavItem: React.FC<{
  page: Page;
  activePage: Page;
  setActivePage: (page: Page) => void;
  icon: JSX.Element;
  label: string;
}> = ({ page, activePage, setActivePage, icon, label }) => (
  <li>
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        setActivePage(page);
      }}
      className={`flex items-center p-3 my-1 rounded-lg transition-colors duration-200 ${
        activePage === page
          ? 'bg-amber-500 text-white shadow-md'
          : 'text-slate-300 hover:bg-slate-700 hover:text-white'
      }`}
    >
      {icon}
      <span className="ml-3 font-medium">{label}</span>
    </a>
  </li>
);

export const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage, isSidebarOpen, setSidebarOpen }) => {
  const DashboardIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );

  const AccountingIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V7a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );

  const DevoteesIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.124-1.28-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.124-1.28.356-1.857m0 0a3.001 3.001 0 015.288 0M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );

  const ServicesIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  );

  return (
    <>
      <div className={`fixed inset-0 bg-black bg-opacity-50 z-20 transition-opacity md:hidden ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setSidebarOpen(false)}></div>
      <aside className={`absolute md:relative z-30 md:z-auto flex-shrink-0 w-64 h-full bg-slate-800 text-white flex flex-col transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="flex flex-col items-center justify-center p-6 border-b border-slate-700">
            <div className="w-16 h-16 rounded-full bg-amber-400 flex items-center justify-center text-slate-800 text-3xl font-bold mb-2">廣</div>
            <h1 className="text-lg font-semibold text-center">{ORGANIZATION_INFO.name}</h1>
        </div>
        <nav className="flex-1 px-4 py-4">
          <ul className="space-y-2">
            <NavItem page={Page.Dashboard} activePage={activePage} setActivePage={setActivePage} icon={<DashboardIcon />} label="儀表板" />
            <NavItem page={Page.Accounting} activePage={activePage} setActivePage={setActivePage} icon={<AccountingIcon />} label="會計帳務" />
            <NavItem page={Page.Devotees} activePage={activePage} setActivePage={setActivePage} icon={<DevoteesIcon />} label="信眾管理" />
            <NavItem page={Page.Services} activePage={activePage} setActivePage={setActivePage} icon={<ServicesIcon />} label="服務項目" />
          </ul>
        </nav>
        <div className="p-4 border-t border-slate-700 text-xs text-slate-400">
          <p>&copy; {new Date().getFullYear()} {ORGANIZATION_INFO.name}</p>
          <p>系統版本 1.0.0</p>
        </div>
      </aside>
    </>
  );
};
