"use client";

import { SterlingGateNav } from "@/components/SterlingGateNav";
import { Hero } from "@/components/landing/Hero";

export default function Home() {
  return (
    <div style={{ backgroundColor: "var(--bg)", minHeight: "100vh" }}>
      <SterlingGateNav />
      <main>
        <Hero />
      </main>
    </div>
  );
}
