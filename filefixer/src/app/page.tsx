"use client";

import React from "react";
import { HeroSection } from "@/components/home/HeroSection";
import { SmartDropZone } from "@/components/home/SmartDropZone";
import { PopularWorkflows } from "@/components/home/PopularWorkflows";
import { QuickActionGrid } from "@/components/home/QuickActionGrid";
import { FeaturedToolsGrid } from "@/components/home/FeaturedToolsGrid";
import { SupportedFormats } from "@/components/home/SupportedFormats";
import { PrivacyArchitecture } from "@/components/home/PrivacyArchitecture";
import { SupportBanner } from "@/components/home/SupportBanner";
import { HomeFAQ } from "@/components/home/HomeFAQ";

export default function HomePage() {
  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      {/* Background ambient light */}
      <div className="absolute inset-0 -z-10 flex items-center justify-center opacity-30 blur-3xl pointer-events-none overflow-hidden">
        <div className="h-[420px] w-[580px] rounded-full bg-gradient-to-tr from-[hsl(var(--primary)/0.35)] to-sky-500/20" />
      </div>

      {/* 1. HERO + SMART DROP ZONE (Fix your files. Keep them private.) */}
      <section className="relative overflow-hidden pt-6 sm:pt-12 md:pt-16">
        <HeroSection />
        <div className="mx-auto mt-7 sm:mt-10 max-w-3xl px-4 sm:px-6">
          <SmartDropZone />
        </div>
      </section>

      {/* 2. POPULAR WORKFLOWS GRID */}
      <PopularWorkflows />

      {/* 3. QUICK ACTION LAUNCHER ("What do you want to do?") */}
      <QuickActionGrid />

      {/* 4. EVERYDAY FILE UTILITIES GRID */}
      <FeaturedToolsGrid />

      {/* 5. SUPPORTED FORMATS & OPERATIONS */}
      <SupportedFormats />

      {/* 6. PRIVACY CENTER ARCHITECTURE */}
      <PrivacyArchitecture />

      {/* 7. VOLUNTARY SUPPORT CALLOUT */}
      <SupportBanner />

      {/* 8. FAQ */}
      <HomeFAQ />
    </div>
  );
}
