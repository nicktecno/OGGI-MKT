"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import {
  GA_MEASUREMENT_ID,
  isAnalyticsEnabled,
  trackPageView,
} from "@/lib/analytics";
import { WebVitalsReporter } from "@/components/analytics/web-vitals-reporter";

function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!GA_MEASUREMENT_ID || !isAnalyticsEnabled()) return;
    const qs = searchParams.toString();
    const path = qs ? `${pathname ?? "/"}?${qs}` : (pathname ?? "/");
    trackPageView(path);
  }, [pathname, searchParams]);

  return null;
}

export function Analytics() {
  if (!GA_MEASUREMENT_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga-inline-init" strategy="afterInteractive">
        {`
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: false });
`}
      </Script>
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
      <WebVitalsReporter />
    </>
  );
}
