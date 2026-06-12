'use client';

/**
 * Admin Panel - Catch-all route for all admin sections
 * Route: /admin/[[...section]]
 * 
 * Maps to AdminAppWithAuth which handles its own internal section routing.
 * Sections: dashboard, orders, products, settings, customers, etc.
 */
import { Suspense, lazy, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useApp } from '../../providers';
import { isAdminRole } from '@/utils/appHelpers';

import dynamic from 'next/dynamic';

const AdminAppWithAuth = dynamic(
  () => import('@/views/AdminAppWithAuth'),
  { ssr: false }
);

const StoreChatModal = dynamic(
  () => import('@/components/store/StoreChatModal').then((m) => ({ default: m.StoreChatModal })),
  { ssr: false }
);

export default function AdminSectionPage() {
  const router = useRouter();
  const params = useParams();
  const app = useApp();

  // Redirect non-admin users to login
  if (!isAdminRole(app.user?.role)) {
    return (
      <div className="admin-font-scope min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Access Denied</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-4">You need admin access to view this page.</p>
          <button
            onClick={() => router.push('/admin/login')}
            className="px-6 py-2 bg-primary text-white rounded-lg"
          >
            Admin Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-font-scope">
      <Suspense fallback={
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      }>
        <AdminAppWithAuth
          activeTenantId={app.activeTenantId}
          tenants={app.headerTenants}
          orders={app.orders}
          products={app.products}
          logo={app.logo}
          themeConfig={app.themeConfig}
          websiteConfig={app.websiteConfig}
          deliveryConfig={app.deliveryConfig}
          paymentMethods={app.paymentMethods}
          courierConfig={app.courierConfig}
          facebookPixelConfig={app.facebookPixelConfig}
          chatMessages={app.chatMessages}
          parentUser={app.user}
          onLogout={app.handleLogout}
          onUpdateOrder={app.handlers.handleUpdateOrder}
          onAddProduct={app.handlers.handleAddProduct}
          onUpdateProduct={app.handlers.handleUpdateProduct}
          onDeleteProduct={app.handlers.handleDeleteProduct}
          onBulkDeleteProducts={app.handlers.handleBulkDeleteProducts}
          onBulkUpdateProducts={app.handlers.handleBulkUpdateProducts}
          onBulkFlashSale={app.handlers.handleBulkFlashSale}
          onBulkTagAssign={app.handlers.handleBulkTagAssign}
          onBulkStockUpdate={app.handlers.handleBulkStockUpdate}
          onBulkAddProducts={app.handlers.handleBulkAddProducts}
          onProductOrderChange={app.handlers.handleProductOrderChange}
          onUpdateLogo={app.handlers.handleUpdateLogo}
          onUpdateTheme={app.handlers.handleUpdateTheme}
          onUpdateWebsiteConfig={app.handlers.handleUpdateWebsiteConfig}
          onUpdateDeliveryConfig={app.handlers.handleUpdateDeliveryConfig}
          onUpdatePaymentMethods={app.handlers.handleUpdatePaymentMethods}
          onUpdateCourierConfig={app.handlers.handleUpdateCourierConfig}
          onUpdateFacebookPixelConfig={app.handlers.handleUpdateFacebookPixelConfig}
          onUpdateProfile={app.handleUpdateProfile}
          onTenantChange={app.handleTenantChange}
          onCreateTenant={app.handleCreateTenant}
          onDeleteTenant={app.handleDeleteTenant}
          onRefreshTenants={app.refreshTenants}
          isTenantSwitching={app.isTenantSwitching}
          onSwitchToStore={() => router.push('/')}
          onOpenAdminChat={app.handleOpenAdminChat}
          hasUnreadChat={app.hasUnreadChat}
          landingPages={app.landingPages}
          onCreateLandingPage={app.handleCreateLandingPage}
          onUpsertLandingPage={app.handleUpsertLandingPage}
          onToggleLandingPublish={app.handleToggleLandingPublish}
          onAddOrder={app.handlers.handleAddOrder}
        />

        {/* Admin Chat Modal */}
        <StoreChatModal
          isOpen={app.isAdminChatOpen}
          onClose={app.handleCloseAdminChat}
          tenantId={app.activeTenantId}
          websiteConfig={app.websiteConfig}
          user={app.user}
          messages={app.chatMessages}
          onSendMessage={app.handleAdminSendChat}
          context="admin"
          onEditMessage={app.handleEditChatMessage}
          onDeleteMessage={app.handleDeleteChatMessage}
          canDeleteAll={true}
        />
      </Suspense>
    </div>
  );
}
