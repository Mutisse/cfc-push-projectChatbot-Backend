// src/modules/prayers/routes/prayerRoutes.ts
import { Router } from "express";
import { PrayerController } from "../controllers/prayerController";

const router = Router();
const prayerController = new PrayerController();

// ==================== HEALTH CHECK ====================
router.get("/health", prayerController.healthCheck);

// ==================== ROTAS PÚBLICAS ====================
router.post("/public/request", prayerController.createPrayerRequest);
router.get("/public/my-prayers/:phone", prayerController.searchMyPrayersByPhone);
router.get("/public/my-prayers/edit/:id", prayerController.getMyPrayerForEdit);
router.put("/public/my-prayers/:id", prayerController.updateMyPrayerRequest);
router.delete("/public/my-prayers/:id", prayerController.deleteMyPrayer);

// ==================== ROTAS ADMINISTRATIVAS ====================
router.get("/", prayerController.getAllPrayers);
router.get("/:id", prayerController.getPrayerById);
router.put("/:id", prayerController.updatePrayer);

// Soft Delete (Admin)
router.delete("/:id/soft", prayerController.softDeletePrayer);
router.patch("/:id/restore", prayerController.restorePrayer);
router.get("/deleted", prayerController.getDeletedPrayers);

// Hard Delete (Admin)
router.delete("/:id/hard", prayerController.hardDeletePrayer);
router.post("/hard/bulk", prayerController.hardDeleteMany);

// Operações Especiais (Admin)
router.patch("/:id/prayed", prayerController.markAsPrayed);
router.patch("/:id/status", prayerController.updatePrayerStatus);
router.patch("/:id/assign", prayerController.assignPrayer);

// Estatísticas (Admin)
router.get("/stats", prayerController.getPrayerStats);
router.get("/urgent-pending", prayerController.getUrgentPendingPrayers);
router.get("/recent/:days?", prayerController.getRecentPrayers);
router.get("/summary", prayerController.getPrayerSummary);

export default router;