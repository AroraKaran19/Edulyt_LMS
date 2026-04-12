import { Router } from "express";
import { verifyUser } from "../middlewares/user.middleware";
import { verifyAdmin } from "../middlewares/admin.middleware";
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

router.get("/", verifyUser, verifyAdmin, listPartnershipImportConfigs);
router.post("/", verifyUser, verifyAdmin, createPartnershipImportConfig);

router.get(
  "/:partnershipImportConfigId/whitelist/stats",
  verifyUser,
  verifyAdmin,
  getCollaborationWhitelistStats
);
router.get(
  "/:partnershipImportConfigId/whitelist",
  verifyUser,
  verifyAdmin,
  listCollaborationWhitelist
);
router.post(
  "/:partnershipImportConfigId/whitelist/import",
  verifyUser,
  verifyAdmin,
  importCollaborationWhitelist
);
router.put(
  "/:partnershipImportConfigId/whitelist/:entryId",
  verifyUser,
  verifyAdmin,
  updateCollaborationWhitelistEntry
);
router.delete(
  "/:partnershipImportConfigId/whitelist/:entryId",
  verifyUser,
  verifyAdmin,
  deleteCollaborationWhitelistEntry
);
router.post(
  "/:partnershipImportConfigId/whitelist/:entryId/retry",
  verifyUser,
  verifyAdmin,
  retryCollaborationWhitelistEntry
);

router.get(
  "/:partnershipImportConfigId",
  verifyUser,
  verifyAdmin,
  getPartnershipImportConfigById
);
router.put(
  "/:partnershipImportConfigId",
  verifyUser,
  verifyAdmin,
  updatePartnershipImportConfig
);
router.delete(
  "/:partnershipImportConfigId",
  verifyUser,
  verifyAdmin,
  deletePartnershipImportConfig
);

export default router;
