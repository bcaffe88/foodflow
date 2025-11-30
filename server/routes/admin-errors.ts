/**
 * Admin Error Management Routes
 * Dashboard para visualizar e gerenciar erros
 */

import type { Express } from "express";
import type { AuthRequest } from "../auth/middleware";
import { authenticate, requireRole } from "../auth/middleware";
import { getErrorStats, getRecentErrors, getErrorsByCode, clearErrorLog } from "../services/error-tracking-service";

export function registerAdminErrorRoutes(app: Express) {
  /**
   * GET /api/admin/errors/stats
   * Admin dashboard - error statistics
   */
  app.get(
    "/api/admin/errors/stats",
    authenticate,
    requireRole("admin"),
    async (req: AuthRequest, res) => {
      try {
        const stats = getErrorStats();
        res.json({
          success: true,
          data: stats,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        res.status(500).json({
          error: "Falha ao obter estatísticas de erro",
          code: "ERROR_STATS_FAILED",
        });
      }
    }
  );

  /**
   * GET /api/admin/errors/recent
   * Get recent errors for dashboard
   */
  app.get(
    "/api/admin/errors/recent",
    authenticate,
    requireRole("admin"),
    async (req: AuthRequest, res) => {
      try {
        const limit = parseInt(req.query.limit as string) || 50;
        const errors = getRecentErrors(Math.min(limit, 500));
        res.json({
          success: true,
          data: errors,
          count: errors.length,
        });
      } catch (error) {
        res.status(500).json({
          error: "Falha ao obter erros recentes",
          code: "RECENT_ERRORS_FAILED",
        });
      }
    }
  );

  /**
   * GET /api/admin/errors/code/:code
   * Get errors by type for debugging
   */
  app.get(
    "/api/admin/errors/code/:code",
    authenticate,
    requireRole("admin"),
    async (req: AuthRequest, res) => {
      try {
        const { code } = req.params;
        const limit = parseInt(req.query.limit as string) || 50;
        const errors = getErrorsByCode(code, Math.min(limit, 500));
        res.json({
          success: true,
          code,
          data: errors,
          count: errors.length,
        });
      } catch (error) {
        res.status(500).json({
          error: "Falha ao obter erros",
          code: "GET_ERRORS_FAILED",
        });
      }
    }
  );

  /**
   * POST /api/admin/errors/clear
   * Clear error log (admin only)
   */
  app.post(
    "/api/admin/errors/clear",
    authenticate,
    requireRole("admin"),
    async (req: AuthRequest, res) => {
      try {
        clearErrorLog();
        res.json({
          success: true,
          message: "Log de erros limpo com sucesso",
        });
      } catch (error) {
        res.status(500).json({
          error: "Falha ao limpar log de erros",
          code: "CLEAR_ERRORS_FAILED",
        });
      }
    }
  );
}
