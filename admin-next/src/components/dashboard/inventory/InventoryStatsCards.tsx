import React from 'react';

interface InventoryStats {
  totalProducts: number;
  totalUnits: number;
  lowStockCount: number;
  outOfStockCount: number;
  inventoryValue: number;
  inventorySaleValue: number;
}

interface InventoryStatsCardsProps {
  stats: InventoryStats;
  lowStockThreshold: number;
}

const ProductIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 16V8.00002C20.9996 7.6493 20.9071 7.30483 20.7315 7.00119C20.556 6.69754 20.3037 6.44539 20 6.27002L13 2.27002C12.696 2.09449 12.3511 2.00208 12 2.00208C11.6489 2.00208 11.304 2.09449 11 2.27002L4 6.27002C3.69626 6.44539 3.44398 6.69754 3.26846 7.00119C3.09294 7.30483 3.00036 7.6493 3 8.00002V16C3.00036 16.3508 3.09294 16.6952 3.26846 16.9989C3.44398 17.3025 3.69626 17.5547 4 17.73L11 21.73C11.304 21.9056 11.6489 21.998 12 21.998C12.3511 21.998 12.696 21.9056 13 21.73L20 17.73C20.3037 17.5547 20.556 17.3025 20.7315 16.9989C20.9071 16.6952 20.9996 16.3508 21 16Z" stroke="#333" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3.27002 6.96002L12 12.01L20.73 6.96002" stroke="#333" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 22.08V12" stroke="#333" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CatalogIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 19.5C4 18.837 4.26339 18.2011 4.73223 17.7322C5.20107 17.2634 5.83696 17 6.5 17H20" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6.5 2H20V22H6.5C5.83696 22 5.20107 21.7366 4.73223 21.2678C4.26339 20.7989 4 20.163 4 19.5V4.5C4 3.83696 4.26339 3.20107 4.73223 2.73223C5.20107 2.26339 5.83696 2 6.5 2Z" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const WarningIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10.29 3.86001L1.82002 18C1.64539 18.3024 1.55299 18.6453 1.55201 18.9945C1.55103 19.3437 1.64151 19.6871 1.81445 19.9905C1.98738 20.2939 2.23675 20.5467 2.53773 20.7239C2.83871 20.901 3.18082 20.9962 3.53002 21H20.47C20.8192 20.9962 21.1613 20.901 21.4623 20.7239C21.7633 20.5467 22.0127 20.2939 22.1856 19.9905C22.3585 19.6871 22.449 19.3437 22.448 18.9945C22.4471 18.6453 22.3547 18.3024 22.18 18L13.71 3.86001C13.5318 3.56611 13.2807 3.32313 12.9812 3.15449C12.6817 2.98585 12.3438 2.89726 12 2.89726C11.6563 2.89726 11.3184 2.98585 11.0188 3.15449C10.7193 3.32313 10.4682 3.56611 10.29 3.86001Z" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 9V13" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 17H12.01" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const GrowthIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M23 6L13.5 15.5L8.5 10.5L1 18" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M17 6H23V12" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const GrowthIconOrange = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M23 6L13.5 15.5L8.5 10.5L1 18" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M17 6H23V12" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const InventoryStatsCards: React.FC<InventoryStatsCardsProps> = ({ stats, lowStockThreshold }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-5">
      <div className="bg-[#f9f9f9] rounded-lg p-4 flex justify-between items-start">
        <div className="flex flex-col gap-2">
          <p className="text-[16px] font-medium text-black">Products</p>
          <div>
            <p className="text-lg sm:text-xl lg:text-lg sm:text-xl lg:text-lg sm:text-xl lg:text-lg sm:text-xl lg:text-[24px] font-medium text-black">{stats.totalProducts}</p>
            <p className="text-[12px] text-[#979797]">Category wise</p>
          </div>
        </div>
        <div className="bg-white rounded-lg w-[44px] h-[44px] flex items-center justify-center"><ProductIcon /></div>
      </div>

      <div className="bg-[#f9f9f9] rounded-lg p-4 flex justify-between items-start">
        <div className="flex flex-col gap-2">
          <p className="text-[16px] font-medium text-black">Total unit on hand</p>
          <div>
            <p className="text-lg sm:text-xl lg:text-lg sm:text-xl lg:text-lg sm:text-xl lg:text-lg sm:text-xl lg:text-[24px] font-medium text-black">{stats.totalUnits}</p>
            <p className="text-[12px] text-[#979797]">Products entire shop</p>
          </div>
        </div>
        <div className="bg-white rounded-lg w-[44px] h-[44px] flex items-center justify-center"><CatalogIcon /></div>
      </div>

      <div className="bg-[#f9f9f9] rounded-lg p-4 flex justify-between items-start">
        <div className="flex flex-col gap-2">
          <p className="text-[16px] font-medium text-black">Low stock</p>
          <div>
            <p className="text-lg sm:text-xl lg:text-lg sm:text-xl lg:text-lg sm:text-xl lg:text-lg sm:text-xl lg:text-[24px] font-medium text-black">{stats.lowStockCount}</p>
            <p className="text-[12px] text-[#979797]">{stats.outOfStockCount} out / {stats.lowStockCount} low ({'<'}{lowStockThreshold})</p>
          </div>
        </div>
        <div className="bg-white rounded-lg w-[44px] h-[44px] flex items-center justify-center"><WarningIcon /></div>
      </div>

      <div className="bg-[#f9f9f9] rounded-lg p-4 flex justify-between items-start">
        <div className="flex flex-col gap-2">
          <p className="text-[16px] font-medium text-black">Capital value</p>
          <div>
            <p className="text-lg sm:text-xl lg:text-lg sm:text-xl lg:text-lg sm:text-xl lg:text-lg sm:text-xl lg:text-[24px] font-medium text-black">৳ {stats.inventoryValue.toLocaleString('en-IN')}</p>
            <p className="text-[12px] text-[#979797]">Cost Price</p>
          </div>
        </div>
        <div className="bg-white rounded-lg w-[44px] h-[44px] flex items-center justify-center"><GrowthIcon /></div>
      </div>

      <div className="bg-[#f9f9f9] rounded-lg p-4 flex justify-between items-start">
        <div className="flex flex-col gap-2">
          <p className="text-[16px] font-medium text-black">Inventory value</p>
          <div>
            <p className="text-lg sm:text-xl lg:text-lg sm:text-xl lg:text-lg sm:text-xl lg:text-lg sm:text-xl lg:text-[24px] font-medium text-black">৳ {stats.inventorySaleValue.toLocaleString('en-IN')}</p>
            <p className="text-[12px] text-[#979797]">Selling Price</p>
          </div>
        </div>
        <div className="bg-white rounded-lg w-[44px] h-[44px] flex items-center justify-center"><GrowthIconOrange /></div>
      </div>
    </div>
  );
};

export default InventoryStatsCards;
