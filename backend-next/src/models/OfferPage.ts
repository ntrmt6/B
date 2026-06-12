import mongoose, { Schema, Document } from 'mongoose';

export interface IOfferPageBenefit {
  id: string;
  text: string;
}

export interface IOfferPageFAQ {
  id: string;
  question: string;
  answer: string;
}

export interface IOfferPageReview {
  id: string;
  name: string;
  quote: string;
  rating: number;
  image?: string;
}

export interface IOfferPage extends Document {
  tenantId: string;
  productId?: number;
  productTitle: string;
  searchQuery?: string;
  imageUrl: string;
  productImages?: string[];
  offerEndDate: Date;
  description: string;
  productOfferInfo: string; // HTML content
  paymentSectionTitle: string; // HTML content
  benefits: IOfferPageBenefit[];
  whyBuySection: string; // HTML content
  // New dynamic sections
  faqs: IOfferPageFAQ[];
  faqHeadline?: string;
  reviews: IOfferPageReview[];
  reviewHeadline?: string;
  videoLink?: string;
  price?: number;
  originalPrice?: number;
  backgroundColor?: string;
  textColor?: string;
  urlSlug: string;
  status: 'draft' | 'published';
  views: number;
  orders: number;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

const OfferPageBenefitSchema = new Schema({
  id: { type: String, required: true },
  text: { type: String, required: true }
}, { _id: false });

const OfferPageFAQSchema = new Schema({
  id: { type: String, required: true },
  question: { type: String, required: true },
  answer: { type: String, required: true }
}, { _id: false });

const OfferPageReviewSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  quote: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  image: { type: String }
}, { _id: false });

const OfferPageSchema = new Schema<IOfferPage>({
  tenantId: {
    type: String,
    required: true,
    index: true
  },
  productId: {
    type: Number,
    index: true
  },
  productTitle: {
    type: String,
    required: true,
    trim: true
  },
  searchQuery: {
    type: String,
    trim: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  productImages: {
    type: [String],
    default: []
  },
  offerEndDate: {
    type: Date,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  productOfferInfo: {
    type: String,
    default: ''
  },
  paymentSectionTitle: {
    type: String,
    default: ''
  },
  benefits: {
    type: [OfferPageBenefitSchema],
    default: []
  },
  whyBuySection: {
    type: String,
    default: ''
  },
  // New dynamic sections
  faqs: {
    type: [OfferPageFAQSchema],
    default: []
  },
  faqHeadline: {
    type: String,
    default: ''
  },
  reviews: {
    type: [OfferPageReviewSchema],
    default: []
  },
  reviewHeadline: {
    type: String,
    default: ''
  },
  videoLink: {
    type: String,
    default: ''
  },
  price: {
    type: Number
  },
  originalPrice: {
    type: Number
  },
  backgroundColor: {
    type: String,
    default: '#FFFFFF'
  },
  textColor: {
    type: String,
    default: '#000000'
  },
  urlSlug: {
    type: String,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft',
    index: true
  },
  views: {
    type: Number,
    default: 0
  },
  orders: {
    type: Number,
    default: 0
  },
  publishedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Compound index for tenant + slug uniqueness
OfferPageSchema.index({ tenantId: 1, urlSlug: 1 }, { unique: true });
OfferPageSchema.index({ tenantId: 1, status: 1, createdAt: -1 });

export const OfferPage = mongoose.model<IOfferPage>('OfferPage', OfferPageSchema);
