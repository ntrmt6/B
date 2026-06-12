import React, { useState, lazy, Suspense } from "react";

const ProductReviews = lazy(() => import('../../../../components/store/ProductReviews').then(m => ({ default: m.ProductReviews })));

interface DescriptionProduct {
    id?: number;
    title?: string;
    description?: string;
    material?: string;
    brand?: string;
    features?: string[];
    modelNumber?: string;
    origin?: string;
    dimensions?: string;
    weight?: string;
    videoUrl?: string;
    colors?: string[];
    details?: Array<{ type: string; description: string }>;
}

interface DescriptionProps {
    product: DescriptionProduct;
    tenantId?: string;
    user?: { name: string; email: string } | null;
    onLoginClick?: () => void;
}

export default function Description({ product, tenantId, user, onLoginClick }: DescriptionProps) {
    const [activeTab, setActiveTab] = useState<'description' | 'specification' | 'reviews'>('description');
    const [videoPlaying, setVideoPlaying] = useState(false);

    // Extract YouTube video ID if available
    const getYouTubeVideoId = (url: string): string | null => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const videoId = product.videoUrl ? getYouTubeVideoId(product.videoUrl) : null;
    const videoThumbnail = videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null;

    // Build specs from details (key features)
    const specs: Array<{ label: string; value: string }> = [];
    if (product.details?.length) {
        for (const detail of product.details) {
            if (detail.type?.trim() && detail.description?.trim()) {
                specs.push({ label: detail.type, value: detail.description });
            }
        }
    }
    if (specs.length === 0) {
        if (product.material) specs.push({ label: "Material", value: product.material });
        if (product.brand) specs.push({ label: "Brand", value: product.brand });
        if (product.features?.length) specs.push({ label: "Features", value: product.features.join(", ") });
        if (product.modelNumber) specs.push({ label: "Model Number", value: product.modelNumber });
        if (product.origin) specs.push({ label: "Place of Origin", value: product.origin });
        if (product.dimensions) specs.push({ label: "Dimensions", value: product.dimensions });
        if (product.weight) specs.push({ label: "Weight", value: product.weight });
        if (product.colors?.length) specs.push({ label: "Colors", value: product.colors.join(", ") });
    }

    const tabs = [
        { key: 'description' as const, label: 'Description' },
        { key: 'specification' as const, label: 'Specification' },
        { key: 'reviews' as const, label: 'Reviews' },
    ];

    return (
        <div className="flex-1 min-w-0 px-0 py-0 rounded-2xl">
            {/* Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-1">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-3 lg:px-5 py-1.5 lg:py-2 text-sm lg:text-xl font-medium leading-[150%] font-lato rounded-full whitespace-nowrap transition-all ${
                            activeTab === tab.key
                                ? 'border border-[#FF6A00] text-[#FF6A00] bg-orange-50/50'
                                : 'border border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="mt-3 lg:mt-8">
                {/* Description Tab */}
                {activeTab === 'description' && (
                    <div className="flex flex-col lg:flex-row items-start gap-4">
                        <div className="w-full lg:w-[50%]">
                            {product.description ? (
                                <div className="font-lato text-[16px] leading-[150%] prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: product.description }} />
                            ) : (
                                <p className="font-lato text-[16px] leading-[150%] text-gray-400">No description available</p>
                            )}
                        </div>
                        {videoId && (
                            <div className="w-full lg:w-[50%]">
                                {videoPlaying ? (
                                    <div className="relative w-full rounded-xl overflow-hidden" style={{ paddingBottom: '56.25%' }}>
                                        <iframe
                                            className="absolute top-0 left-0 w-full h-full rounded-xl"
                                            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
                                            title="Product Video"
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        />
                                    </div>
                                ) : (
                                    <div className="relative cursor-pointer group" onClick={() => setVideoPlaying(true)}>
                                        <img src={videoThumbnail} alt="Video" className="w-full lg:m-auto rounded-xl" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg group-hover:bg-red-700 transition-colors group-hover:scale-110 transform duration-200">
                                                <svg className="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Specification Tab */}
                {activeTab === 'specification' && (
                    <div>
                        {specs.length > 0 ? (
                            <div className="overflow-hidden rounded-lg border border-gray-200">
                                <table className="w-full">
                                    <tbody>
                                        {specs.map((spec, i) => (
                                            <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                                                <td className="px-4 py-3 font-lato font-semibold text-[14px] lg:text-[16px] text-gray-700 w-[35%] border-r border-gray-200">
                                                    {spec.label}
                                                </td>
                                                <td className="px-4 py-3 font-lato text-[14px] lg:text-[16px] text-gray-600">
                                                    {spec.value}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="font-lato text-[16px] text-gray-400">No specifications available</p>
                        )}
                    </div>
                )}

                {/* Reviews Tab */}
                {activeTab === 'reviews' && (
                    <div>
                        {tenantId && product.id ? (
                            <Suspense fallback={
                                <div className="flex items-center justify-center py-12">
                                    <div className="w-10 h-10 border-4 border-[#FF6A00] border-t-transparent rounded-full animate-spin" />
                                </div>
                            }>
                                <ProductReviews
                                    productId={product.id}
                                    productName={product.title || ''}
                                    tenantId={tenantId}
                                    user={user || null}
                                    onLoginClick={onLoginClick || (() => {})}
                                />
                            </Suspense>
                        ) : (
                            <p className="font-lato text-[16px] text-gray-400">Reviews are not available</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
