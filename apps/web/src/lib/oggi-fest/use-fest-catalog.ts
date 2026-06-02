"use client";

import { useCallback, useEffect, useState } from "react";
import {
  OGGI_CATALOG_CHANGED_EVENT,
  readAdminCatalog,
  type AdminCatalog,
} from "./admin-catalog-storage";

export function useFestCatalog(): AdminCatalog {
  const [catalog, setCatalog] = useState<AdminCatalog>(() =>
    typeof window !== "undefined" ? readAdminCatalog() : readAdminCatalog(),
  );

  const sync = useCallback(() => {
    setCatalog(readAdminCatalog());
  }, []);

  useEffect(() => {
    sync();
    window.addEventListener(OGGI_CATALOG_CHANGED_EVENT, sync);
    return () => window.removeEventListener(OGGI_CATALOG_CHANGED_EVENT, sync);
  }, [sync]);

  return catalog;
}
