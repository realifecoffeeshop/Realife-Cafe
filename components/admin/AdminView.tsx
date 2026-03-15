import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AdminView as AdminViewEnum } from '../../types';
import Dashboard from './Dashboard';
import MenuManagement from './MenuManagement';
import DiscountManagement from './DiscountManagement';
import PermissionsManagement from './PermissionsManagement';
import FeedbackView from './FeedbackView';
import TutorialManagement from './TutorialManagement';
import QRCodeGenerator from './QRCodeGenerator';
import OrderHistory from './OrderHistory';

const NavItem: React.FC<{ view: AdminViewEnum; activeTab: AdminViewEnum; onSelect: (view: AdminViewEnum) => void; children: React.ReactNode }> = ({ view, activeTab, onSelect, children }) => {
  const isActive = activeTab === view;
  return (
    <button
      onClick={() => onSelect(view)}
      className={`relative px-4 py-2 font-medium text-sm transition-colors whitespace-nowrap ${
        isActive
          ? 'text-stone-800 dark:text-white'
          : 'text-stone-500 hover:text-stone-700 dark:hover:text-zinc-300'
      }`}
    >
      <span className="relative z-10">{children}</span>
      {isActive && (
        <motion.div
          layoutId="admin-tab-active"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-stone-800 dark:bg-white"
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      )}
      <motion.div
        className="absolute inset-0 bg-stone-200/0 dark:bg-white/0 rounded-t-lg -z-0"
        whileHover={{ backgroundColor: 'rgba(165, 141, 121, 0.1)' }}
        transition={{ duration: 0.2 }}
      />
    </button>
  );
};

const AdminView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminViewEnum>(AdminViewEnum.DASHBOARD);

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
      case AdminViewEnum.TUTORIALS:
        return <TutorialManagement key="tutorials" />;
      case AdminViewEnum.QR_CODE:
        return <QRCodeGenerator key="qrcode" />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-6 text-stone-800 dark:text-white">Admin Panel</h1>
      <div className="border-b border-stone-200 dark:border-zinc-700 overflow-x-auto">
        <nav className="-mb-px flex space-x-4">
            <NavItem view={AdminViewEnum.DASHBOARD} activeTab={activeTab} onSelect={setActiveTab}>Dashboard</NavItem>
            <NavItem view={AdminViewEnum.ORDER_HISTORY} activeTab={activeTab} onSelect={setActiveTab}>Order History</NavItem>
            <NavItem view={AdminViewEnum.MENU} activeTab={activeTab} onSelect={setActiveTab}>Menu</NavItem>
            <NavItem view={AdminViewEnum.QR_CODE} activeTab={activeTab} onSelect={setActiveTab}>QR Code</NavItem>
            <NavItem view={AdminViewEnum.DISCOUNTS} activeTab={activeTab} onSelect={setActiveTab}>Discounts</NavItem>
            <NavItem view={AdminViewEnum.PERMISSIONS} activeTab={activeTab} onSelect={setActiveTab}>Permissions</NavItem>
            <NavItem view={AdminViewEnum.FEEDBACK} activeTab={activeTab} onSelect={setActiveTab}>Feedback</NavItem>
            <NavItem view={AdminViewEnum.TUTORIALS} activeTab={activeTab} onSelect={setActiveTab}>Tutorials</NavItem>
        </nav>
      </div>
      <div className="mt-6 bg-stone-50 dark:bg-zinc-900 rounded-b-lg overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdminView;
