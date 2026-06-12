import { useState, lazy, Suspense } from "react";
import { ProductDescription } from "./ProductDescription";

const ProductReviews = lazy(() => import('../../store/ProductReviews').then(m => ({ default: m.ProductReviews })));

interface ProductTabsProps {
  description?: string;
  videoUrl?: string;
  details?: Array<{ type: string; description: string }>;
  productId?: number;
  productName?: string;
  tenantId?: string;
  user?: { name: string; email: string } | null;
  onLoginClick?: () => void;
  reviewCount?: number;
}

export const ProductTabs = ({ description, videoUrl, details, productId, productName, tenantId, user, onLoginClick, reviewCount }: ProductTabsProps) => {
  const [activeTab, setActiveTab] = useState<'description' | 'additional' | 'reviews'>('description');

  return (
    <div className="bg-white box-border caret-transparent border border-neutral-200 my-[15px] px-3.5 py-[11px] rounded-[15px] border-solid md:bg-transparent md:my-[30px] md:p-[18px]">
      <div className="box-border caret-transparent">
        <div className="box-border caret-transparent gap-x-2.5 flex flex-wrap gap-y-2.5">
          <button
            onClick={() => setActiveTab('description')}
            className={`${activeTab === 'description' ? 'text-lime-500' : 'text-zinc-500'} text-[13px] font-bold bg-white caret-transparent block min-h-[auto] min-w-[auto] text-center border border-stone-300 px-3 py-[11px] rounded-[30px] font-arial md:text-[17px] md:px-6 md:py-[13px]`}
          >
            {" "}
            Description{" "}
          </button>
          {details && details.length > 0 && (
            <button
              onClick={() => setActiveTab('additional')}
              className={`${activeTab === 'additional' ? 'text-lime-500' : 'text-zinc-500'} text-[13px] font-bold bg-white caret-transparent block min-h-[auto] min-w-[auto] text-center border border-stone-300 px-3 py-[11px] rounded-[30px] font-arial md:text-[17px] md:px-6 md:py-[13px]`}
            >
              {" "}
              Additional Info{" "}
            </button>
          )}
          <button
            onClick={() => setActiveTab('reviews')}
            className={`${activeTab === 'reviews' ? 'text-lime-500' : 'text-zinc-500'} text-[13px] font-bold bg-white caret-transparent block min-h-[auto] min-w-[auto] text-center border border-stone-300 px-3 py-[11px] rounded-[30px] font-arial md:text-[17px] md:px-6 md:py-[13px]`}
          >
            {" "}
            Reviews({reviewCount ?? 0}){" "}
          </button>
        </div>
        <div className="box-border caret-transparent my-[15px] md:my-[30px]">
          {activeTab === 'description' && (
            <ProductDescription description={description} videoUrl={videoUrl} />
          )}
          {activeTab === 'additional' && details && (
            <div className="box-border caret-transparent">
              <table className="w-full text-sm">
                <tbody>
                  {details.map((detail, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : ''}>
                      <td className="font-semibold p-2 border border-gray-200">{detail.type}</td>
                      <td className="p-2 border border-gray-200">{detail.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {activeTab === 'reviews' && productId && tenantId && (
            <Suspense fallback={<div className="flex justify-center py-8"><div className="animate-spin w-6 h-6 border-2 border-lime-500 border-t-transparent rounded-full" /></div>}>
              <ProductReviews
                productId={productId}
                productName={productName || ''}
                tenantId={tenantId}
                user={user || null}
                onLoginClick={onLoginClick || (() => {})}
              />
            </Suspense>
          )}
        </div>
      </div>
    </div>
  );
};
