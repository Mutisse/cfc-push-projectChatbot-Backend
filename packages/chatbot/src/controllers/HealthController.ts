import { Request, Response } from "express";
import { cacheService } from "../services/CacheService";
import { DatabaseService } from "../services/DatabaseService";

export class HealthController {
  // ✅ HEALTH CHECK SIMPLIFICADO
  async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      const cacheStats = cacheService.getCacheStats();
      const dbStatus = DatabaseService.getConnectionStatus();
      
      // ✅ CORRIGIDO: Usar propriedades corretas
      res.json({
        success: true,
        service: "CFC Push Chatbot (AUTÔNOMO)",
        status: "operational",
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        architecture: "Independente (sem API Management)",
        components: {
          database: dbStatus.isConnected ? "✅ Conectado" : "❌ Offline",
          cache: cacheStats.isLoaded          // ← Mudado de isInitialized para isLoaded
            ? "✅ Inicializado"
            : "❌ Não inicializado",
          sessions: "✅ Operacional",
          reports: "✅ Ativo",
        },
        stats: {
          database: dbStatus.database,
          cachedMenus: cacheStats.totalMenus,
          cacheLastUpdate: cacheStats.lastRefresh || "N/A",  // ← Mudado de lastUpdate para lastRefresh
        },
      });
    } catch (error: any) {
      console.error("❌ Erro no health check:", error);
      res.status(500).json({
        success: false,
        service: "CFC Push Chatbot",
        status: "degraded",
        timestamp: new Date().toISOString(),
        error: error.message,
      });
    }
  }

  // ✅ DIAGNÓSTICO DO SISTEMA
  async diagnostics(req: Request, res: Response): Promise<void> {
    try {
      const cacheStats = cacheService.getCacheStats();
      const dbStatus = DatabaseService.getConnectionStatus();

      // ✅ Adicionar propriedades ausentes ou usar alternativas
      const enhancedCacheStats = {
        ...cacheStats,
        isInitialized: cacheStats.isLoaded,      // ← Usar isLoaded como isInitialized
        lastUpdate: cacheStats.lastRefresh,      // ← Usar lastRefresh como lastUpdate
        cacheAge: cacheStats.lastRefresh 
          ? Date.now() - new Date(cacheStats.lastRefresh).getTime()
          : null
      };

      const diagnostics = {
        timestamp: new Date().toISOString(),
        system: {
          nodeVersion: process.version,
          platform: process.platform,
          uptime: Math.round(process.uptime()) + "s",
          memory:
            Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + " MB",
        },
        database: {
          connected: dbStatus.isConnected,
          databaseName: dbStatus.database,
          readyState: this.getReadyStateText(dbStatus.readyState),
          models: dbStatus.models,
        },
        cache: enhancedCacheStats,  // ← Usar stats melhorados
        configuration: {
          node_env: process.env.NODE_ENV,
          port: process.env.PORT,
          mongodb_uri: process.env.MONGODB_URI
            ? "✅ Configurado"
            : "❌ Não configurado",
        },
      };

      res.json({
        success: true,
        diagnostics,
        summary: {
          status:
            dbStatus.isConnected && cacheStats.isLoaded  // ← Usar isLoaded
              ? "✅ Saudável"
              : "⚠️ Atenção",
          recommendations: this.generateRecommendations(diagnostics),
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // ✅ MÉTODOS AUXILIARES
  private getReadyStateText(state: number): string {
    const states = {
      0: "❌ Desconectado",
      1: "✅ Conectado",
      2: "🔄 Conectando",
      3: "⚠️ Desconectando",
    };
    return states[state as keyof typeof states] || "❓ Desconhecido";
  }

  private generateRecommendations(diagnostics: any): string[] {
    const recommendations: string[] = [];

    if (!diagnostics.database.connected) {
      recommendations.push("🔧 Verificar conexão com MongoDB");
    }

    if (!diagnostics.cache.isInitialized) {
      recommendations.push("🔄 Inicializar cache dos menus");
    }

    if (diagnostics.cache.cacheAge && diagnostics.cache.cacheAge > 300000) {
      recommendations.push("⏰ Cache desatualizado - atualizar manualmente");
    }

    if (recommendations.length === 0) {
      recommendations.push("✅ Sistema operando normalmente");
    }

    return recommendations;
  }
}

export const healthController = new HealthController();