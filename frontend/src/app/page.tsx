"use client";

import dynamic from "next/dynamic";
import { SterlingGateNav } from "@/components/SterlingGateNav";
import { Hero } from "@/components/landing/Hero";
import { HazardCategories } from "@/components/landing/HazardCategories";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { CommunityReviews } from "@/components/landing/CommunityReviews";
import { Footer } from "@/components/landing/Footer";

const RealLeafletMap = dynamic(
  () => import("@/components/landing/RealLeafletMap").then((mod) => mod.RealLeafletMap),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          width: "100%",
          height: "560px",
          backgroundColor: "var(--bg)",
          borderTop: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-secondary)",
          fontSize: "14px",
          fontWeight: 700,
        }}
      >
        Initializing Sri Lanka Real-Time Geospatial Map...
      </div>
    ),
  }
);

export default function Home() {
  return (
    <div style={{ backgroundColor: "var(--bg)", minHeight: "100vh" }}>
      <SterlingGateNav />
      <main>
        <Hero />
        <HazardCategories />
        <HowItWorks />
        <RealLeafletMap />
        <CommunityReviews />
      </main>
      <Footer />
    </div>
  );
}
