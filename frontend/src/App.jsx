import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { BranchProvider } from './context/BranchContext';
import { CartProvider } from './context/CartContext';
import { Navbar } from './components/Navbar';
import { CartDrawer } from './components/CartDrawer';
import { AuthModal } from './components/AuthModal';
import { LandingPage } from './pages/LandingPage';
import { OrderStatusPage } from './pages/OrderStatusPage';
import { CashierDashboard } from './pages/CashierDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { MyOrdersPage } from './pages/MyOrdersPage';
import { TableQRPrint } from './pages/TableQRPrint';

export function AppContent() {
  const [activeTab, setActiveTab] = useState('home'); // home | my-orders | order-status | cashier | admin | qr-print
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [activeOrderNumber, setActiveOrderNumber] = useState('');
  const [qrPrintData, setQrPrintData] = useState({ tables: [], branchId: 1 });

  // Handle URL hash or path on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderParam = params.get('order');
    if (orderParam) {
      setActiveOrderNumber(orderParam);
      setActiveTab('order-status');
    }
  }, []);

  const handleOrderSuccess = (createdOrder) => {
    if (createdOrder && createdOrder.order_number) {
      setActiveOrderNumber(createdOrder.order_number);
      setActiveTab('order-status');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleOpenQRPrint = (tables, branchId) => {
    setQrPrintData({ tables, branchId });
    setActiveTab('qr-print');
  };

  return (
    <div className="app-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navigation (hidden in print mode) */}
      {activeTab !== 'qr-print' && (
        <Navbar
          activeTab={activeTab}
          onNavigate={(tab) => {
            setActiveTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenAuth={() => setAuthModalOpen(true)}
        />
      )}

      {/* Main Pages */}
      <div style={{ flex: 1 }}>
        {activeTab === 'home' && <LandingPage />}

        {activeTab === 'my-orders' && (
          <MyOrdersPage
            onSelectOrder={(orderNum) => {
              setActiveOrderNumber(orderNum);
              setActiveTab('order-status');
            }}
            onBack={() => setActiveTab('home')}
          />
        )}

        {activeTab === 'order-status' && (
          <OrderStatusPage
            orderNumber={activeOrderNumber}
            onBack={() => setActiveTab('home')}
          />
        )}

        {activeTab === 'cashier' && <CashierDashboard />}

        {activeTab === 'admin' && (
          <AdminDashboard
            onOpenQRPrint={handleOpenQRPrint}
          />
        )}

        {activeTab === 'qr-print' && (
          <TableQRPrint
            tables={qrPrintData.tables}
            branchId={qrPrintData.branchId}
            onBack={() => setActiveTab('admin')}
          />
        )}
      </div>

      {/* Cart Drawer */}
      <CartDrawer
        onOpenAuth={() => setAuthModalOpen(true)}
        onOrderSuccess={handleOrderSuccess}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BranchProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </BranchProvider>
    </AuthProvider>
  );
}

