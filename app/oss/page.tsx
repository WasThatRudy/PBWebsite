import type { Metadata } from "next";
import OssDashboard from "@/components/oss/OssDashboard";

export const metadata: Metadata = {
  title: "OSS",
  description: "Point Blank open source contributions and merged pull requests.",
};

export default function OssPage() {
  return (
    <section className="w-full" id="oss">
      <OssDashboard endpoint="/api/contributions" />
    </section>
  );
}
