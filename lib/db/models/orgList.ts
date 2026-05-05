import mongoose, { Schema, Document, Model } from "mongoose";

export interface IOrgList extends Document {
  login: string;
  programs: ("gsoc" | "lfx")[];
  createdAt: Date;
  updatedAt: Date;
}

const OrgListSchema = new Schema<IOrgList>(
  {
    login:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    programs: { type: [String], enum: ["gsoc", "lfx"], required: true },
  },
  { timestamps: true }
);

OrgListSchema.index({ login: 1 });
OrgListSchema.index({ programs: 1 });

const OrgList: Model<IOrgList> =
  mongoose.models.OrgList || mongoose.model<IOrgList>("OrgList", OrgListSchema);

export default OrgList;