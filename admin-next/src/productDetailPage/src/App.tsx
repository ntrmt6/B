import ProductDetailsPage from "./components/ProductDetails";

export default function App() {
  return (
    <div>
      <ProductDetailsPage product={{
        id: 0,
        name: "",
        price: 0,
        originalPrice: undefined,
        discount: undefined,
        rating: undefined,
        reviews: undefined,
        category: undefined,
        image: "",
        galleryImages: undefined,
        colors: undefined,
        sizes: undefined,
        brand: undefined,
        description: undefined,
        videoUrl: undefined,
        totalSold: undefined,
        tags: undefined,
        stock: undefined,
        variantGroups: undefined,
        details: undefined,
        shortDescription: undefined
      }} />
    </div>
  );
}
