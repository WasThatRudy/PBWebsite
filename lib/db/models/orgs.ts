import mongoose, { Schema, Document, Model } from "mongoose";

export interface IOrg extends Document {
  login:       string;
  avatarUrl:   string;
  htmlUrl:     string;
  platform:    "github" | "gitlab";
  lastFetched: Date;
  createdAt:   Date;
  updatedAt:   Date;
}

const OrgSchema = new Schema<IOrg>(
  {
    login:       { type: String, required: true, lowercase: true, trim: true },
    avatarUrl:   { type: String, required: true },
    htmlUrl:     { type: String, required: true },
    platform:    { type: String, enum: ["github", "gitlab"], default: "github" },
    lastFetched: { type: Date,   default: Date.now },
  },
  { timestamps: true },
);

OrgSchema.index({ login: 1, platform: 1 }, { unique: true });

const Org: Model<IOrg> =
  mongoose.models.Org || mongoose.model<IOrg>("Org", OrgSchema);

export default Org;