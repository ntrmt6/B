import { Tag } from 'lucide-react';

interface MobileCategoryItem {
    id: string;
    name: string;
    slug?: string;
    image: string;
    iconUrl?: string;
}

interface MobileCategoriesProps {
    categories?: MobileCategoryItem[];
    onCategoryClick?: (slug: string) => void;
}

export default function MobileCategories({ categories = [], onCategoryClick }: MobileCategoriesProps) {
    if (categories.length === 0) return null;

    return (
        <div className="bg-white rounded-xl px-3 py-4 mx-3">
            <h2 className="text-base font-lato font-bold mb-3 px-1">Categories</h2>
            <div className="flex flex-wrap gap-2">
                {categories.map((cat) => {
                    const imgSrc = cat.image || cat.iconUrl || '';
                    return (
                        <a
                            key={cat.id}
                            href="#"
                            onClick={(e) => { e.preventDefault(); onCategoryClick?.(cat.slug || cat.name); }}
                            className="flex items-center gap-2 py-1.5 px-2.5 rounded-full border border-gray-100 hover:bg-gray-50 hover:border-gray-200 transition-all active:scale-95"
                        >
                            {imgSrc ? (
                                <div className="w-7 h-7 flex-shrink-0 bg-gray-50 rounded-full overflow-hidden">
                                    <img
                                        src={imgSrc}
                                        alt={cat.name}
                                        className="object-cover w-full h-full"
                                        loading="lazy"
                                    />
                                </div>
                            ) : (
                                <div className="w-7 h-7 flex-shrink-0 bg-gray-100 rounded-full flex items-center justify-center">
                                    <Tag size={14} className="text-gray-400" />
                                </div>
                            )}
                            <span className="text-xs font-medium text-gray-700">
                                {cat.name}
                            </span>
                        </a>
                    );
                })}
            </div>
        </div>
    );
}
