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
      {/* Hero ambient atmospheric light */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -z-10 w-full max-w-5xl h-[550px] pointer-events-none overflow-hidden opacity-60 dark:opacity-75 blur-3xl" aria-hidden="true">
        <div className="mx-auto h-[380px] w-[620px] rounded-full bg-gradient-to-tr from-blue-600/30 via-indigo-500/20 to-violet-500/25" />
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
