import React, { useState, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { Accounting } from './pages/Accounting';
import { Devotees } from './pages/Devotees';
import { Services } from './pages/Services';
import { Page } from './types';

// The old App component is now MainApplication
const MainApplication: React.FC = () => {
  const [activePage, setActivePage] = useState<Page>(Page.Dashboard);
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const renderPage = useCallback(() => {
    switch (activePage) {
      case Page.Dashboard:
        return <Dashboard setActivePage={setActivePage} />;
      case Page.Accounting:
        return <Accounting />;
      case Page.Devotees:
        return <Devotees setActivePage={setActivePage} />;
      case Page.Services:
        return <Services />;
      default:
        return <Dashboard setActivePage={setActivePage} />;
    }
  }, [activePage]);

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
      <Sidebar activePage={activePage} setActivePage={setActivePage} isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header toggleSidebar={() => setSidebarOpen(!isSidebarOpen)} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-100 dark:bg-slate-900 p-4 sm:p-6 lg:p-8">
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

export default MainApplication;
