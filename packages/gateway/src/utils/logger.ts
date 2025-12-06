import { AuditLog } from '../models/AuditLog';

export class GatewayLogger {
  // Log de proxy
  static async logProxyRequest(
    req: any,
    targetService: string,
    duration: number,
    status: 'success' | 'failed'
  ) {
    try {
      await AuditLog.logProxy(
        'gateway',
        targetService as any,
        'request',
        {
          method: req.method,
          path: req.path,
          originalUrl: req.originalUrl,
          headers: req.headers,
          query: req.query,
          body: req.body
        },
        status,
        duration
      );
    } catch (error) {
      console.error('❌ Erro ao logar proxy:', error);
    }
  }

  // Log de evento
  static async logEvent(
    event: string,
    sourceService: string,
    targetService: string,
    data: any,
    status: 'success' | 'failed' = 'success'
  ) {
    try {
      await AuditLog.logEvent(
        event,
        sourceService as any,
        targetService as any,
        data,
        status
      );
    } catch (error) {
      console.error('❌ Erro ao logar evento:', error);
    }
  }

  // Log de orquestração
  static async logOrchestration(
    action: string,
    data: any,
    fromService?: string,
    toService?: string
  ) {
    try {
      await AuditLog.logOrchestration(
        action,
        data,
        { from: fromService, to: toService }
      );
    } catch (error) {
      console.error('❌ Erro ao logar orquestração:', error);
    }
  }

  // Log de serviço
  static async logServiceAction(
    service: string,
    action: string,
    data: any,
    status: 'success' | 'failed' = 'success'
  ) {
    try {
      await AuditLog.log({
        action,
        service: service as any,
        details: data,
        status,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('❌ Erro ao logar ação:', error);
    }
  }

  // Métodos rápidos para cada serviço
  static async logChatbot(action: string, data: any) {
    await this.logServiceAction('chatbot', action, data);
  }

  static async logManagement(action: string, data: any) {
    await this.logServiceAction('management', action, data);
  }

  static async logMonitoring(action: string, data: any) {
    await this.logServiceAction('monitoring', action, data);
  }

  static async logNotify(action: string, data: any) {
    await this.logServiceAction('notify', action, data);
  }

  static async logGateway(action: string, data: any) {
    await this.logServiceAction('gateway', action, data);
  }
}