/**
 * Estado de comércio (catálogo admin / vitrine demo).
 * - Com API e integração interna configuradas no servidor: dados vêm do banco via API Nest.
 * - Caso contrário: fallback em cookie (`commerce-cookies`), útil para desenvolvimento sem DB.
 */
export type {
  DemoCommerceDelta,
  DemoCommerceState,
  DemoProductPatch,
} from "./commerce-cookies";
export {
  mergeProducts,
  readCommerceDelta,
  updateCommerceDelta,
  writeCommerceDelta,
} from "./commerce-cookies";
export type { SupplierAccountOption } from "./commerce-backend";
export {
  commerceUsesDatabase,
  fetchSupplierAccountsFromApi,
  getCommerceState,
  getDemoCommerceState,
  persistApproveExecutionRequest,
  persistCreateExecutionRequest,
  persistArchiveAssignment,
  persistAssignmentStorefrontHighlight,
  persistCompositeProductPricing,
  persistCreateCompositeProduct,
  persistCreateDirectAssignment,
  persistDeleteCompositeProduct,
  persistExecutorPublishAssignment,
  persistProductGalleryImage,
  persistProductMarketplaceImage,
  persistRemoveProductGalleryImage,
  persistRejectExecutionRequest,
  persistSetProductActive,
  persistSetProductAdminPaused,
  persistCheckoutReserve,
} from "./commerce-backend";
