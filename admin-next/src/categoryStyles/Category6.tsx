import React from "react";
import { ArrowRight } from "lucide-react";

// --- Types & Interfaces ---
interface ImageStyles {
  bottom: string;
  right: string;
  width: string;
  height?: string;
}

interface CategoryCardData {
  id: string;
  category: string;
  title: string;
  bgColor: string;
  textColor: string;
  titleColor: string;
  imageUrl: string;
  imageAlt: string;
  hasButton: boolean;
  buttonColor?: string;
  width: "large" | "small";
  imageStyles: ImageStyles;
}

// --- Mock Data ---
const TOP_ROW: CategoryCardData[] = [
  {
    id: "sofa",
    category: "Home & Living",
    title: "SOFA",
    bgColor: "#EDEDED",
    textColor: "#717171",
    titleColor: "#808080",
    imageUrl: "https://c.animaapp.com/uenEc7oC/img/pair-blue-running-sneakers-white-background-isolated-1@2x.png", // Asset from provided code mapping to Sofa
    imageAlt: "Grey Sofa with White Pillows",
    hasButton: true,
    buttonColor: "#4B4B4B",
    width: "large",
    imageStyles: { bottom: "0px", right: "20px", width: "380px" },
  },
  {
    id: "sneakers",
    category: "Clothing & Shoes",
    title: "SNEAKERS",
    bgColor: "#D9EFF9",
    textColor: "#3297C5",
    titleColor: "#809FB0",
    imageUrl: "https://c.animaapp.com/uenEc7oC/img/pair-blue-running-sneakers-white-background-isolated-1-1@2x.png",
    imageAlt: "Blue Sneakers",
    hasButton: false,
    width: "small",
    imageStyles: { bottom: "20px", right: "10px", width: "260px" },
  },
  {
    id: "toy-train-1",
    category: "Toys & Entertainment",
    title: "TOY TRAIN",
    bgColor: "#FEF9C4",
    textColor: "#DDC14C",
    titleColor: "#9A9573",
    imageUrl: "https://c.animaapp.com/uenEc7oC/img/pair-blue-running-sneakers-white-background-isolated-1-2@2x.png",
    imageAlt: "Red and Yellow Toy Train",
    hasButton: false,
    width: "small",
    imageStyles: { bottom: "10px", right: "10px", width: "220px" },
  },
];

const BOTTOM_ROW: CategoryCardData[] = [
  {
    id: "toy-train-2",
    category: "Toys & Entertainment",
    title: "TOY TRAIN",
    bgColor: "#F2E7E3",
    textColor: "#BCA299",
    titleColor: "#8F817D",
    imageUrl: "https://c.animaapp.com/uenEc7oC/img/pair-blue-running-sneakers-white-background-isolated-1-3@2x.png",
    imageAlt: "Framed Abstract Art",
    hasButton: false,
    width: "small",
    imageStyles: { bottom: "15px", right: "20px", width: "220px" },
  },
  {
    id: "party-decors",
    category: "Toys & Entertainment",
    title: "PARTY\nDECORS",
    bgColor: "#E3F2E6",
    textColor: "#27B342",
    titleColor: "#7AA283",
    imageUrl: "https://c.animaapp.com/uenEc7oC/img/pair-blue-running-sneakers-white-background-isolated-1-4@2x.png",
    imageAlt: "Party Hats",
    hasButton: false,
    width: "small",
    imageStyles: { bottom: "20px", right: "20px", width: "200px" },
  },
  {
    id: "diamond-ring",
    category: "Jewelry & Accessories",
    title: "DIAMOND\nRING",
    bgColor: "#FAE8E8",
    textColor: "#C53D41",
    titleColor: "#918181",
    imageUrl: "https://c.animaapp.com/uenEc7oC/img/pair-blue-running-sneakers-white-background-isolated-1-5@2x.png",
    imageAlt: "Diamond Ring in Red Box",
    hasButton: true,
    buttonColor: "#C53D41",
    width: "large",
    imageStyles: { bottom: "0px", right: "20px", width: "350px" },
  },
];

// --- Sub-Components ---
const CategoryCard = ({ card }: { card: CategoryCardData }) => {
  const isLarge = card.width === "large";
  
  return (
    <article
      className={`relative overflow-hidden rounded-[25px] h-[350px] flex-shrink-0 transition-transform duration-300 hover:scale-[1.01]
        ${isLarge ? "w-full lg:w-[650px]" : "w-full lg:w-[310px]"}`}
      style={{
        backgroundColor: card.bgColor,
        fontFamily: "'Montserrat', sans-serif"
      }}
    >
      {/* Product Image */}
      <div 
        className="absolute z-10 pointer-events-none"
        style={{
          bottom: card.imageStyles.bottom,
          right: card.imageStyles.right,
          width: card.imageStyles.width,
        }}
      >
        <img
          src={card.imageUrl}
          alt={card.imageAlt}
          className="w-full h-auto object-contain drop-shadow-2xl"
        />
      </div>

      {/* Content Layer */}
      <div className="relative z-20 p-8 h-full flex flex-col pointer-events-none">
        <h3 
          className="font-medium text-lg mb-1"
          style={{ color: card.textColor }}
        >
          {card.category}
        </h3>
        
        <p 
          className="font-extrabold text-5xl md:text-6xl tracking-tight leading-[1.1] mb-6 whitespace-pre-line"
          style={{ color: card.titleColor }}
        >
          {card.title}
        </p>

        {card.hasButton && (
          <button
            className="mt-4 w-fit flex items-center gap-2 px-6 py-3 rounded-md text-white font-semibold text-xs transition-opacity hover:opacity-90 pointer-events-auto shadow-lg"
            style={{ backgroundColor: card.buttonColor }}
          >
            SHOP NOW
            <ArrowRight size={14} />
          </button>
        )}
      </div>
    </article>
  );
};

// --- Main Application Component ---
export const Category6 = () => {
  return (
    <div className="min-h-screen bg-white py-16 px-4 md:px-8 flex flex-col items-center">
      {/* Font Import */}
      <link 
        href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap" 
        rel="stylesheet" 
      />

      {/* Header */}
      <header className="mb-14 text-center">
        <h1 className="text-5xl md:text-[64px] font-bold text-[#4B4B4B] font-[Montserrat] tracking-tight">
          Product Categories
        </h1>
      </header>

      {/* Grid Container */}
      <main className="max-w-[1360px] w-full flex flex-col gap-6 items-center">
        {/* Top Row */}
        <div className="flex flex-wrap justify-center gap-6 w-full">
          {TOP_ROW.map((card) => (
            <CategoryCard key={card.id} card={card} />
          ))}
        </div>

        {/* Bottom Row */}
        <div className="flex flex-wrap justify-center gap-6 w-full">
          {BOTTOM_ROW.map((card) => (
            <CategoryCard key={card.id} card={card} />
          ))}
        </div>
      </main>
    </div>
  );
};

// Default export for the preview environment
export default Category6;