import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: "user" | "admin";
  preferences: {
    promotions: boolean;
    order_updates: boolean;
    recommendations: boolean;
  };
  createdAt: Date;
  lastLoginAt?: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      default: "user",
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    preferences: {
      promotions: {
        type: Boolean,
        default: true,
      },
      order_updates: {
        type: Boolean,
        default: true,
      },
      recommendations: {
        type: Boolean,
        default: true,
      },
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    lastLoginAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

UserSchema.virtual("id").get(function () {
  return (this._id as mongoose.Types.ObjectId).toHexString();
});

UserSchema.set("toJSON", {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const User = mongoose.model<IUser>("User", UserSchema);

export default User;
