import React from 'react';
import { signOut } from "firebase/auth";
import { auth } from '../firebaseClient';

interface HeaderProps {
  toggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  
  const handleSignOut = async () => {
    await signOut(auth);
    // The onAuthStateChanged listener in App.tsx will handle redirecting to the login page.
  };

  return (
    <header className="flex-shrink-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between">
      <div className="flex items-center">
        <button onClick={toggleSidebar} className="text-slate-500 dark:text-slate-400 focus:outline-none md:hidden mr-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </button>
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 hidden sm:block">管理系統</h2>
      </div>
      <div className="flex items-center space-x-4">
        <button 
          onClick={handleSignOut} 
          className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-red-500 dark:hover:text-red-400"
        >
          登出
        </button>
      </div>
    </header>
  );
};