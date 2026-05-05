import mongoose, { Schema, Document, Model } from "mongoose";

export interface IOrg extends Document {
  login: string;
  avatarUrl: string;
  htmlUrl: string;
  lastFetched: Date;
}

const OrgSchema = new Schema<IOrg>(
  {
    login: { type: String, required: true, unique: true },
    avatarUrl: { type: String, required: true },
    htmlUrl: { type: String, required: true },
    lastFetched: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Org: Model<IOrg> =
  mongoose.models.Org || mongoose.model<IOrg>("Org", OrgSchema);

export default Org;