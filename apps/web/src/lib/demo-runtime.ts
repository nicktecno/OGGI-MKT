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
export {
  commerceUsesDatabase,
  getCommerceState,
  getDemoCommerceState,
  persistApproveExecutionRequest,
  persistCreateExecutionRequest,
  persistArchiveAssignment,
  persistAssignmentStorefrontHighlight,
  persistCompositeProductPricing,
  persistCreateCompositeProduct,
  persistCreateDirectAssignment,
  persistExecutorPublishAssignment,
  persistProductMarketplaceImage,
  persistRejectExecutionRequest,
  persistSetProductActive,
  persistSetProductAdminPaused,
} from "./commerce-backend";
