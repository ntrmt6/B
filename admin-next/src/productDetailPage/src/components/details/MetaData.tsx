interface MetaDataProduct {
    description?: string;
    shortDescription?: string;
    details?: Array<{ type: string; description: string }>;
}

interface MetaDataProps {
    product: MetaDataProduct;
}

export default function MetaData({ product }: MetaDataProps) {
    // Show short description if available
    const shortDesc = product.shortDescription?.trim();
    
    if (!shortDesc) return null;

    return (
        <div className="mb-6">
            <div 
                className="text-sm text-gray-600 font-lato leading-relaxed prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: shortDesc }}
            />
        </div>
    );
}
