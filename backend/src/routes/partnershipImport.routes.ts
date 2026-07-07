import { Router } from "express";
import { adminGuard } from "../middlewares/admin.middleware";
import {
  createPartnershipImportConfig,
  deletePartnershipImportConfig,
  getPartnershipImportConfigById,
  listPartnershipImportConfigs,
  updatePartnershipImportConfig,
} from "../controllers/partnershipImportConfig.controller";
import {
  deleteCollaborationWhitelistEntry,
  getCollaborationWhitelistStats,
  importCollaborationWhitelist,
  listCollaborationWhitelist,
  retryCollaborationWhitelistEntry,
  updateCollaborationWhitelistEntry,
} from "../controllers/collaborationWhitelist.controller";

const router = Router();

router.get("/", ...adminGuard("settings.partnership-import"),listPartnershipImportConfigs);
router.post("/", ...adminGuard("settings.partnership-import"),createPartnershipImportConfig);

router.get(
  "/:partnershipImportConfigId/whitelist/stats",
  ...adminGuard("settings.partnership-import"),
  getCollaborationWhitelistStats
);
router.get(
  "/:partnershipImportConfigId/whitelist",
  ...adminGuard("settings.partnership-import"),
  listCollaborationWhitelist
);
router.post(
  "/:partnershipImportConfigId/whitelist/import",
  ...adminGuard("settings.partnership-import"),
  importCollaborationWhitelist
);
router.put(
  "/:partnershipImportConfigId/whitelist/:entryId",
  ...adminGuard("settings.partnership-import"),
  updateCollaborationWhitelistEntry
);
router.delete(
  "/:partnershipImportConfigId/whitelist/:entryId",
  ...adminGuard("settings.partnership-import"),
  deleteCollaborationWhitelistEntry
);
router.post(
  "/:partnershipImportConfigId/whitelist/:entryId/retry",
  ...adminGuard("settings.partnership-import"),
  retryCollaborationWhitelistEntry
);

router.get(
  "/:partnershipImportConfigId",
  ...adminGuard("settings.partnership-import"),
  getPartnershipImportConfigById
);
router.put(
  "/:partnershipImportConfigId",
  ...adminGuard("settings.partnership-import"),
  updatePartnershipImportConfig
);
router.delete(
  "/:partnershipImportConfigId",
  ...adminGuard("settings.partnership-import"),
  deletePartnershipImportConfig
);

export default router;
