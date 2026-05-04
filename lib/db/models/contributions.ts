import mongoose, { Schema, Document, Model } from "mongoose";

export interface IContribution extends Document {
  username: string;
  repoFullName: string;
  repoStars: number;
  orgLogin: string;
  type: "pr" | "commit";

  title: string;  
  url: string;    
  isMerged: boolean | null;
  mergedAt: Date | null;
  committedAt: Date | null;

  scrapedAt: Date;
}

const ContributionSchema = new Schema<IContribution>(
  {
    username:     { type: String, required: true, index: true },
    repoFullName: { type: String, required: true },
    repoStars:    { type: Number, required: true },
    orgLogin:     { type: String, required: true, index: true, ref: "Org" },

    type: { type: String, enum: ["pr", "commit"], required: true },

    title: { type: String, required: true },
    url:   { type: String, required: true },

    //PR
    isMerged: { type: Boolean, default: null },
    mergedAt: { type: Date,    default: null },

    //Commit
    committedAt: { type: Date, default: null },

    scrapedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);
ContributionSchema.index({ username: 1, url: 1 }, { unique: true });

const Contribution: Model<IContribution> =
  mongoose.models.Contribution ||
  mongoose.model<IContribution>("Contribution", ContributionSchema);

export default Contribution;
