import dotenv from "dotenv";

dotenv.config();

// ========== INTERFACES ==========

interface NotifyPendingResponse {
  count?: number;
  notifications?: any[];
  success?: boolean;
  error?: string;
  [key: string]: any;
}

interface MemberData {
  memberName: string;
  phone: string;
  [key: string]: any;
}

interface PrayerData {
  userName: string;
  subject: string;
  phone?: string;
  [key: string]: any;
}

interface AlertData {
  message: string;
  [key: string]: any;
}

interface ChatMessageData {
  userId?: string;
  phone?: string;
  message?: string;
  [key: string]: any;
}

interface NotificationData {
  type: string;
  title: string;
  message: string;
  recipient: string;
  data?: any;
}

// ========== CLASSE PRINCIPAL ==========

export class NotificationService {
  // URLs dos 4 serviços (do .env)
  private serviceUrls = {
    chatbot: `${process.env.CHATBOT_URL || "http://localhost:3000"}/health`,
    management: `${
      process.env.MANAGEMENT_URL || "http://localhost:3003"
    }/api/management/health`,
    monitoring: `${
      process.env.MONITORING_URL || "http://localhost:3004"
    }/health`,
    notify: `${process.env.NOTIFY_URL || "http://localhost:3002"}/health`,
  };

  // URLs completas para API
  private apiUrls = {
    chatbot: process.env.CHATBOT_URL || "http://localhost:3000",
    management: process.env.MANAGEMENT_URL || "http://localhost:3003",
    monitoring: process.env.MONITORING_URL || "http://localhost:3004",
    notify: process.env.NOTIFY_URL || "http://localhost:3002",
  };

  // API Keys para serviços (do .env)
  private apiKeys = {
    chatbot: process.env.CHATBOT_API_KEY || "chatbot-secret-123456",
    management: process.env.MANAGEMENT_API_KEY || "management-secret-789012",
    monitoring: process.env.MONITORING_API_KEY || "monitoring-secret-345678",
    notify: process.env.NOTIFY_API_KEY || "notify-secret-901234",
  };

  // ========== MÉTODOS PÚBLICOS ==========

  async processEvent(service: string, event: string, data: any): Promise<any> {
    console.log(`[GATEWAY] Processando evento de ${service}: ${event}`);

    // Validar dados recebidos
    if (!data || typeof data !== "object") {
      throw new Error("Dados do evento inválidos");
    }

    switch (service) {
      case "management":
        return await this.handleManagementEvent(event, data);

      case "chatbot":
        return await this.handleChatbotEvent(event, data);

      case "monitoring":
        return await this.handleMonitoringEvent(event, data);

      case "notify":
        return await this.handleNotifyEvent(event, data);

      default:
        throw new Error(`Serviço não suportado: ${service}`);
    }
  }

  async getPendingNotifications(): Promise<{
    success: boolean;
    count: number;
    notifications: any[];
    timestamp: string;
    error?: string;
  }> {
    try {
      const notifyUrl = `${this.apiUrls.notify}/api/notifications/pending`;

      const response = await this.fetchWithTimeout(
        notifyUrl,
        {
          headers: {
            "X-API-Key": this.apiKeys.notify,
          },
        },
        5000 // 5 segundos timeout
      );

      if (!response.ok) {
        throw new Error(`Notify service returned ${response.status}`);
      }

      // Type assertion usando a interface NotifyPendingResponse
      const data = (await response.json()) as NotifyPendingResponse;

      return {
        success: true,
        count: data.count || 0,
        notifications: data.notifications || [],
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      console.error("❌ Erro ao buscar notificações pendentes:", error);

      // Fallback
      return {
        success: false,
        count: 0,
        notifications: [],
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async checkServicesStatus(): Promise<any> {
    const checks = Object.entries(this.serviceUrls).map(async ([name, url]) => {
      const startTime = Date.now();

      try {
        const response = await this.fetchWithTimeout(url, {}, 3000);
        const responseTime = Date.now() - startTime;

        return {
          name,
          status: response.ok ? "healthy" : "unhealthy",
          url,
          responseTime,
          statusCode: response.status,
        };
      } catch (error: any) {
        return {
          name,
          status: "down",
          url,
          responseTime: Date.now() - startTime,
          error: error.message || "Service unavailable",
        };
      }
    });

    const results = await Promise.all(checks);

    return {
      timestamp: new Date().toISOString(),
      services: results,
      summary: {
        total: results.length,
        healthy: results.filter((s) => s.status === "healthy").length,
        unhealthy: results.filter((s) => s.status === "unhealthy").length,
        down: results.filter((s) => s.status === "down").length,
        avgResponseTime: Math.round(
          results
            .filter((s) => s.responseTime)
            .reduce((acc, curr) => acc + (curr.responseTime || 0), 0) /
            Math.max(1, results.filter((s) => s.responseTime).length)
        ),
      },
    };
  }

  // ========== MÉTODOS PRIVADOS ==========

  private async handleManagementEvent(event: string, data: any): Promise<any> {
    // Eventos do Management
    switch (event) {
      case "member.approved": {
        // Type assertion para MemberData
        const memberData = data as MemberData;

        if (!memberData.memberName || !memberData.phone) {
          throw new Error(
            "Dados de membro incompletos: memberName e phone são obrigatórios"
          );
        }

        return await this.createNotification({
          type: "member_approval",
          title: "🎉 Cadastro Aprovado!",
          message: `Olá ${memberData.memberName}! Seu cadastro foi aprovado.`,
          recipient: memberData.phone,
          data: memberData,
        });
      }

      case "prayer.request": {
        const prayerData = data as PrayerData;

        if (!prayerData.userName || !prayerData.subject) {
          throw new Error(
            "Dados de oração incompletos: userName e subject são obrigatórios"
          );
        }

        return await this.createNotification({
          type: "prayer_request",
          title: "🙏 Pedido de Oração",
          message: `${prayerData.userName} precisa de oração: ${prayerData.subject}`,
          recipient: "prayer_team",
          data: prayerData,
        });
      }

      default:
        return { processed: true, event };
    }
  }

  private async handleChatbotEvent(event: string, data: any): Promise<any> {
    // Eventos do Chatbot
    switch (event) {
      case "user.message": {
        const messageData = data as ChatMessageData;

        // Enviar para analytics no monitoring
        await this.sendToMonitoring("chat_message", messageData);
        return { processed: true, event };
      }

      default:
        return { processed: true, event };
    }
  }

  private async handleMonitoringEvent(event: string, data: any): Promise<any> {
    // Eventos do Monitoring (alertas)
    switch (event) {
      case "alert.triggered": {
        const alertData = data as AlertData;

        if (!alertData.message) {
          throw new Error("Dados de alerta incompletos: message é obrigatório");
        }

        // Enviar alerta para administradores
        return await this.createNotification({
          type: "system_alert",
          title: "⚠️ Alerta do Sistema",
          message: `Alerta: ${alertData.message}`,
          recipient: "admin_group",
          data: alertData,
        });
      }

      default:
        return { processed: true, event };
    }
  }

  private async handleNotifyEvent(event: string, data: any): Promise<any> {
    // Eventos do Notify (confirmações)
    return { processed: true, event };
  }

  private async createNotification(
    notificationData: NotificationData
  ): Promise<any> {
    try {
      const notifyUrl = `${this.apiUrls.notify}/api/notifications`;

      const response = await this.fetchWithTimeout(
        notifyUrl,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": this.apiKeys.notify,
          },
          body: JSON.stringify({
            ...notificationData,
            channels: ["whatsapp"],
          }),
        },
        10000 // 10 segundos timeout
      );

      return await response.json();
    } catch (error) {
      console.error("❌ Erro ao criar notificação:", error);
      throw error;
    }
  }

  private async sendToMonitoring(eventType: string, data: any): Promise<void> {
    try {
      const monitoringUrl = `${this.apiUrls.monitoring}/monitoring/analytics`;

      await this.fetchWithTimeout(
        monitoringUrl,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": this.apiKeys.monitoring,
          },
          body: JSON.stringify({
            type: eventType,
            data: data,
            timestamp: new Date().toISOString(),
          }),
        },
        5000 // 5 segundos timeout
      );
    } catch (error) {
      console.warn("⚠️ Erro ao enviar para monitoring:", error);
      // Não falha o processo principal
    }
  }

  // ========== MÉTODO AUXILIAR ==========

  private async fetchWithTimeout(
    url: string,
    options: RequestInit = {},
    timeout: number = 5000
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`Timeout após ${timeout}ms ao acessar ${url}`);
      }
      throw error;
    }
  }
}
