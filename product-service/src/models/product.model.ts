import mongoose, { Document, Schema, Types } from "mongoose";

export interface IProduct extends Document {
  name: string;
  description: string;
  price: number;
  categories: string[];
  tags: string[];
  inStock: boolean;
  images: string[];
  createdAt: Date;
}

const ProductSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    images: {
      type: [String],
    },
    categories: [
      {
        type: String,
      },
    ],
    tags: [
      {
        type: String,
      },
    ],
    inStock: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

ProductSchema.index({ categories: 1 });
ProductSchema.index({ tags: 1 });

ProductSchema.virtual("id").get(function (this: IProduct) {
  return (this._id as Types.ObjectId).toHexString();
});

ProductSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: function (_, ret) {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const Product = mongoose.model<IProduct>("Product", ProductSchema);

export default Product;
