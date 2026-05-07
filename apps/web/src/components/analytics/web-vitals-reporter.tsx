"use client";

import { useEffect } from "react";
import { onCLS, onFCP, onINP, onLCP, onTTFB } from "web-vitals";
import { isAnalyticsEnabled, reportWebVital } from "@/lib/analytics";

export function WebVitalsReporter() {
  useEffect(() => {
    if (!isAnalyticsEnabled()) return;
    onCLS(reportWebVital);
    onINP(reportWebVital);
    onLCP(reportWebVital);
    onFCP(reportWebVital);
    onTTFB(reportWebVital);
  }, []);
  return null;
}
