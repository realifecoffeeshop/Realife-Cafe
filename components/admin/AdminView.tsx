import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AdminView as AdminViewEnum } from '../../types';
import { useApp } from '../../context/useApp';
import { updateUser } from '../../firebase/firestoreService';
import { AlertCircle, RefreshCw } from 'lucide-react';
import Dashboard from './Dashboard';
import MenuManagement from './MenuManagement';
import DiscountManagement from './DiscountManagement';
import PermissionsManagement from './PermissionsManagement';
import FeedbackView from './FeedbackView';
import QRCodeGenerator from './QRCodeGenerator';
import OrderHistory from './OrderHistory';
import CustomerManagement from './CustomerManagement';
import DevMode from './DevMode';

const NavItem: React.FC<{ view: AdminViewEnum; activeTab: AdminViewEnum; onSelect: (view: AdminViewEnum) => void; children: React.ReactNode }> = ({ view, activeTab, onSelect, children }) => {
  const isActive = activeTab === view;
  return (
    <button
      onClick={() => onSelect(view)}
      className={`relative px-6 py-3 font-medium text-sm transition-all duration-300 whitespace-nowrap ${
        isActive
          ? 'text-stone-900 dark:text-white'
          : 'text-stone-500 hover:text-stone-800 dark:hover:text-zinc-200'
      }`}
    >
      <span className="relative z-10">{children}</span>
      {isActive && (
        <motion.div
          layoutId="admin-tab-active"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-stone-900 dark:bg-white"
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      )}
      <motion.div
        className="absolute inset-0 bg-stone-100/0 dark:bg-white/0 rounded-t-lg -z-0"
        whileHover={{ backgroundColor: 'rgba(165, 141, 121, 0.08)' }}
        transition={{ duration: 0.2 }}
      />
    </button>
  );
};

const AdminView: React.FC = () => {
  const { state, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState<AdminViewEnum>(AdminViewEnum.DASHBOARD);

  const handleFixPermissions = async () => {
    if (!state.currentUser) return;
    try {
        await updateUser(state.currentUser.id, { role: state.currentUser.role });
        // The rules check for the literal string 'Administrator' or 'Kitchen Staff' in the 'role' field
        // This force-update ensures that field exists exactly as expected.
        window.location.reload(); // Refresh to re-initialize listeners
    } catch (err) {
        console.error("Manual permission fix failed:", err);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case AdminViewEnum.DASHBOARD:
        return <Dashboard key="dashboard" />;
      case AdminViewEnum.MENU:
        return <MenuManagement key="menu" />;
      case AdminViewEnum.ORDER_HISTORY:
        return <OrderHistory key="order-history" />;
      case AdminViewEnum.DISCOUNTS:
        return <DiscountManagement key="discounts" />;
      case AdminViewEnum.PERMISSIONS:
        return <PermissionsManagement key="permissions" />;
      case AdminViewEnum.FEEDBACK:
        return <FeedbackView key="feedback" />;
      case AdminViewEnum.QR_CODE:
        return <QRCodeGenerator key="qrcode" />;
      case AdminViewEnum.CUSTOMERS:
        return <CustomerManagement key="customers" />;
      case AdminViewEnum.DEV_MODE:
        return <DevMode key="devmode" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-stone-50/50 dark:bg-zinc-950/50">
      <div className="container mx-auto px-4 py-8 md:px-8">
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-serif font-bold text-stone-900 dark:text-white tracking-tight">
              Admin Panel
            </h1>
            <p className="text-stone-500 dark:text-zinc-400 mt-1">Manage your cafe operations and settings.</p>
          </div>
          
          {state.permissionError && (
            <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-2xl flex items-center gap-4 shadow-sm"
            >
                <div className="bg-red-100 dark:bg-red-800 p-2 rounded-xl text-red-600 dark:text-red-200">
                    <AlertCircle className="w-5 h-5" />
                </div>
                <div className="flex-grow">
                    <p className="text-sm font-bold text-red-900 dark:text-red-100 uppercase tracking-wider">Database Access Restricted</p>
                    <p className="text-xs text-red-700 dark:text-red-300">Your role may not be synced yet.</p>
                </div>
                <button 
                    onClick={handleFixPermissions}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-all shadow-md active:scale-95"
                >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Fix Permissions
                </button>
            </motion.div>
          )}
        </header>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-stone-200 dark:border-zinc-800 overflow-hidden">
          <div className="border-b border-stone-100 dark:border-zinc-800 overflow-x-auto scrollbar-hide">
            <nav className="flex px-2">
                <NavItem view={AdminViewEnum.DASHBOARD} activeTab={activeTab} onSelect={setActiveTab}>Dashboard</NavItem>
                <NavItem view={AdminViewEnum.PERMISSIONS} activeTab={activeTab} onSelect={setActiveTab}>Permissions</NavItem>
                <NavItem view={AdminViewEnum.ORDER_HISTORY} activeTab={activeTab} onSelect={setActiveTab}>Order History</NavItem>
                <NavItem view={AdminViewEnum.CUSTOMERS} activeTab={activeTab} onSelect={setActiveTab}>Customers</NavItem>
                <NavItem view={AdminViewEnum.MENU} activeTab={activeTab} onSelect={setActiveTab}>Menu</NavItem>
                <NavItem view={AdminViewEnum.QR_CODE} activeTab={activeTab} onSelect={setActiveTab}>QR Code</NavItem>
                <NavItem view={AdminViewEnum.DISCOUNTS} activeTab={activeTab} onSelect={setActiveTab}>Discounts</NavItem>
                <NavItem view={AdminViewEnum.FEEDBACK} activeTab={activeTab} onSelect={setActiveTab}>Feedback</NavItem>
                <NavItem view={AdminViewEnum.DEV_MODE} activeTab={activeTab} onSelect={setActiveTab}>Dev Mode</NavItem>
            </nav>
          </div>
          
          <div className="min-h-[600px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminView;
