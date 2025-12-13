import { Router } from "express";
import { PrayerController } from "../controllers/prayerController";

const router = Router();
const prayerController = new PrayerController();

// ==================== HEALTH CHECK ====================
router.get("/health", prayerController.healthCheck);

// ==================== ESTATÍSTICAS (DEVE VIR PRIMEIRO!) ====================
router.get("/stats", prayerController.getPrayerStats);
router.get("/urgent-pending", prayerController.getUrgentPendingPrayers);
router.get("/recent/:days?", prayerController.getRecentPrayers);
router.get("/summary", prayerController.getPrayerSummary);

// ==================== ROTAS PÚBLICAS ====================
router.post("/public/request", prayerController.createPrayerRequest);
router.get(
  "/public/my-prayers/:phone",
  prayerController.searchMyPrayersByPhone
);
router.get("/public/my-prayers/edit/:id", prayerController.getMyPrayerForEdit);
router.put("/public/my-prayers/:id", prayerController.updateMyPrayerRequest);
router.delete("/public/my-prayers/:id/:phone", prayerController.deleteMyPrayer);

// ==================== SOFT DELETE (ANTES de /:id!) ====================
router.get("/deleted", prayerController.getDeletedPrayers); // ✅ PRIMEIRO!
router.delete("/:id/soft", prayerController.softDeletePrayer);
router.patch("/:id/restore", prayerController.restorePrayer);

// ==================== CRUD ADMIN ====================
router.get("/", prayerController.getAllPrayers);
// ⚠️ ATENÇÃO: /:id deve ser a ÚLTIMA rota GET!
router.get("/:id", prayerController.getPrayerById); // ✅ ÚLTIMA!
router.put("/:id", prayerController.updatePrayer);

// ==================== HARD DELETE ====================
router.delete("/:id/hard", prayerController.hardDeletePrayer);
router.post("/hard/bulk", prayerController.hardDeleteMany);

// ==================== OPERAÇÕES ESPECIAIS ====================
router.patch("/:id/status", prayerController.updatePrayerStatus);
router.patch("/:id/prayed", prayerController.markAsPrayed);
router.patch("/:id/assign", prayerController.assignPrayer);

export default router;
