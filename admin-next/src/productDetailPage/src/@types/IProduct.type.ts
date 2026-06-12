export interface Product {
    id: number;
    title: string;
    titleBn: string;
    price: number;
    originalPrice: number;
    discount: number;
    rating: number;
    reviewCount: number;
    category: string;
    images: string[];
    colors: string[];
    sizes: string[];
    material: string;
    brand: string;
    features: string[];
    modelNumber: string;
    origin: string;
    dimensions: string;
    weight: string;
    description: string;
}

export interface Category {
    id: string;
    name: string;
    image: string;
}