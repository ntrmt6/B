import React from 'react';

interface InventoryAlertsPanelProps {
  isInventoryHealthy: boolean;
  lowStockCount: number;
  outOfStockCount: number;
  hasExpiryAlerts: boolean;
  expireThreshold: number;
}

const InventoryAlertsPanel: React.FC<InventoryAlertsPanelProps> = ({
  isInventoryHealthy,
  lowStockCount,
  outOfStockCount,
  hasExpiryAlerts,
  expireThreshold,
}) => {
  return (
    <div className="xl:w-[450px] flex flex-col gap-3 sm:gap-4 lg:gap-6">
      <div className="bg-white rounded-lg shadow-[0px_4px_5px_0px_rgba(0,0,0,0.11)] p-4">
        <div className="mb-3">
          <p className="text-[16px] font-medium text-black">Inventory alerts</p>
          <p className="text-[12px] text-[#979797]">Review the most critical SKUs and plan replenishment</p>
        </div>
        <div className={`p-4 rounded ${isInventoryHealthy ? 'bg-[#ecfdf5]' : 'bg-red-50'}`}>
          <p className={`text-[12px] font-medium text-center ${isInventoryHealthy ? 'text-[#00a557]' : 'text-red-600'}`}>
            {isInventoryHealthy
              ? 'Inventory looks healthy: No low-stock items.'
              : `${lowStockCount} items need attention. ${outOfStockCount} out of stock.`}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-[0px_4px_5px_0px_rgba(0,0,0,0.11)] p-4">
        <div className="mb-3">
          <p className="text-[16px] font-medium text-black">Expired date alerts</p>
          <p className="text-[12px] text-[#979797]">Review the most critical SKUs and plan replenishment</p>
        </div>
        <div className={`p-4 rounded ${!hasExpiryAlerts ? 'bg-[#ecfdf5]' : 'bg-amber-50'}`}>
          <p className={`text-[12px] font-medium text-center ${!hasExpiryAlerts ? 'text-[#00a557]' : 'text-amber-600'}`}>
            {!hasExpiryAlerts
              ? 'Inventory looks healthy: No low-stock items.'
              : `Some items are expiring within ${expireThreshold} days.`}
          </p>
        </div>
      </div>
    </div>
  );
};

export default InventoryAlertsPanel;
