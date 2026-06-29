import mongoose, { Document, Schema } from 'mongoose';

export interface IBlogPost extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  status: 'draft' | 'published';
  seoTitle: string;
  metaDescription: string;
  featuredImage?: string;
  author: {
    userId: mongoose.Types.ObjectId;
    name: string;
    email: string;
  };
  tags?: string[];
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BlogPostSchema = new Schema<IBlogPost>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be URL-friendly (lowercase letters, numbers, and hyphens only)'],
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
    },
    excerpt: {
      type: String,
      required: [true, 'Excerpt is required'],
      maxlength: [500, 'Excerpt cannot exceed 500 characters'],
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
    },
    seoTitle: {
      type: String,
      trim: true,
      maxlength: [70, 'SEO title should not exceed 70 characters for optimal display'],
    },
    metaDescription: {
      type: String,
      trim: true,
      maxlength: [160, 'Meta description should not exceed 160 characters'],
    },
    featuredImage: {
      type: String,
      trim: true,
    },
    author: {
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
      },
    },
    tags: [{
      type: String,
      trim: true,
    }],
    publishedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for efficient querying
BlogPostSchema.index({ slug: 1 }, { unique: true });
BlogPostSchema.index({ status: 1, publishedAt: -1 });
BlogPostSchema.index({ createdAt: -1 });
BlogPostSchema.index({ 'author.userId': 1 });
BlogPostSchema.index({ tags: 1 });

// Text index for search
BlogPostSchema.index({ title: 'text', content: 'text', excerpt: 'text' });

// Pre-save hook to set publishedAt when status changes to published
BlogPostSchema.pre('save', function (next) {
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

export const BlogPost = mongoose.model<IBlogPost>('BlogPost', BlogPostSchema);
