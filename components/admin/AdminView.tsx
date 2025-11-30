import React, { useState } from 'react';
import { AdminView as AdminViewEnum } from '../../types';
import Dashboard from './Dashboard';
import MenuManagement from './MenuManagement';
import DiscountManagement from './DiscountManagement';
import PermissionsManagement from './PermissionsManagement';
import FeedbackView from './FeedbackView';
import TutorialManagement from './TutorialManagement';
import QRCodeGenerator from './QRCodeGenerator';

const AdminView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminViewEnum>(AdminViewEnum.DASHBOARD);

  const NavItem: React.FC<{ view: AdminViewEnum; children: React.ReactNode }> = ({ view, children }) => {
    const isActive = activeTab === view;
    return (
      <button
        onClick={() => setActiveTab(view)}
        className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors border-b-2 ${
          isActive
            ? 'text-stone-700 border-stone-700 dark:text-white dark:border-white'
            : 'text-stone-500 hover:text-stone-700 dark:hover:text-zinc-300 border-transparent'
        }`}
      >
        {children}
      </button>
    );
  };
  
  const renderContent = () => {
    switch (activeTab) {
      case AdminViewEnum.DASHBOARD:
        return <Dashboard />;
      case AdminViewEnum.MENU:
        return <MenuManagement />;
      case AdminViewEnum.DISCOUNTS:
        return <DiscountManagement />;
      case AdminViewEnum.PERMISSIONS:
        return <PermissionsManagement />;
      case AdminViewEnum.FEEDBACK:
        return <FeedbackView />;
      case AdminViewEnum.TUTORIALS:
        return <TutorialManagement />;
      case AdminViewEnum.QR_CODE:
        return <QRCodeGenerator />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-6 text-stone-800 dark:text-white">Admin Panel</h1>
      <div className="border-b border-stone-200 dark:border-zinc-700 overflow-x-auto">
        <nav className="-mb-px flex space-x-4">
            <NavItem view={AdminViewEnum.DASHBOARD}>Dashboard</NavItem>
            <NavItem view={AdminViewEnum.MENU}>Menu</NavItem>
            <NavItem view={AdminViewEnum.QR_CODE}>QR Code</NavItem>
            <NavItem view={AdminViewEnum.DISCOUNTS}>Discounts</NavItem>
            <NavItem view={AdminViewEnum.PERMISSIONS}>Permissions</NavItem>
            <NavItem view={AdminViewEnum.FEEDBACK}>Feedback</NavItem>
            <NavItem view={AdminViewEnum.TUTORIALS}>Tutorials</NavItem>
        </nav>
      </div>
      <div className="mt-6 bg-stone-50 dark:bg-zinc-900 rounded-b-lg">
        {renderContent()}
      </div>
    </div>
  );
};

export default AdminView;