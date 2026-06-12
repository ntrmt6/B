import React, { memo } from 'react';
import { normalizeImageUrl } from '../../../utils/imageUrlHelper';

export const GadgetCategoryCard = memo(({ category, onClick }: {
  category: any; onClick: () => void;
}) => {
  const img = category.image || category.icon;

  return (
    <div className="block">
      <div
        onClick={onClick}
        className="items-center flex flex-col h-[86px] justify-center w-full border border-neutral-200 pt-1 rounded-[10px] border-solid cursor-pointer md:inline-block md:h-full md:pt-3 hover:shadow-[rgba(0,0,0,0.1)_1px_5px_10px_0px] hover:border-zinc-500/60 transition-shadow"
      >
        <div className="bg-white h-10 w-10 overflow-hidden mx-auto rounded-md md:h-[68px] md:w-[68px] md:rounded-[5px]">
          {img ? (
            <img
              alt={category.name}
              src={normalizeImageUrl(img)}
              className="inline-block h-full object-contain w-full"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50 text-xs">
              {category.name?.[0] || '?'}
            </div>
          )}
        </div>
        <div className="text-center">
          <div className="text-neutral-900 text-[12px] font-medium flow-root h-auto leading-[14px] overflow-hidden mx-0 my-1 px-2 md:text-black md:text-sm md:block md:h-[34px] md:leading-[17px] md:mt-1.5 md:mb-0 md:mx-2 md:px-0">
            {category.name}
          </div>
        </div>
      </div>
    </div>
  );
});
GadgetCategoryCard.displayName = 'GadgetCategoryCard';
