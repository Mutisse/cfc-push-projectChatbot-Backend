// src/server.ts - APENAS LÓGICA DO SERVIDOR
import mongoose from 'mongoose';
import { env } from './config/env';
import { app } from './app';
import { cacheService } from './services/CacheService';
import { sessionService } from './services/SessionService';
import { analyticsService } from './services/AnalyticsService';
import { twilioService } from './services/TwilioService';
import { sessionRepository } from './Repository/SessionRepository';

class Server {
  private port: number;
  
  constructor() {
    this.port = parseInt(env.PORT) || 3000;
  }

  async start(): Promise<void> {
    try {
      console.log('\n' + '='.repeat(50));
      console.log('🚀 INICIANDO CFC PUSH CHATBOT SERVER');
      console.log('='.repeat(50));

      // 1. Conectar ao MongoDB
      await this.connectDatabase();

      // 2. Inicializar serviços
      await this.setupServices();

      // 3. Iniciar servidor (app já tem todas as rotas configuradas)
      this.startServer();

      // 4. Configurar graceful shutdown
      this.setupGracefulShutdown();

    } catch (error) {
      console.error('❌ ERRO FATAL NA INICIALIZAÇÃO:', error);
      process.exit(1);
    }
  }

  private async connectDatabase(): Promise<void> {
    console.log('🔌 Conectando ao MongoDB...');
    
    try {
      await mongoose.connect(env.MONGODB_URI, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000
      });

      console.log('✅ MongoDB CONECTADO!');

      mongoose.connection.on('error', (error) => {
        console.error('❌ Erro na conexão MongoDB:', error);
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️ MongoDB desconectado');
      });

    } catch (error) {
      console.error('❌ Não foi possível conectar ao MongoDB:', error);
      throw error;
    }
  }

  private async setupServices(): Promise<void> {
    console.log('\n🛠️  INICIALIZANDO SERVIÇOS...');
    
    try {
      // 1. Testar conexão Twilio
      console.log('📱 Testando conexão Twilio...');
      const twilioOk = await twilioService.testConnection();
      if (twilioOk) {
        console.log('✅ Twilio conectado com sucesso');
      } else {
        console.warn('⚠️ Twilio não conectado - mensagens não serão enviadas');
      }

      // 2. Limpar sessões expiradas
      console.log('🧹 Limpando sessões expiradas...');
      const cleaned = await sessionRepository.cleanupExpiredSessions();
      if (cleaned > 0) {
        console.log(`✅ ${cleaned} sessões expiradas removidas`);
      }

      // 3. Carregar cache inicial
      console.log('📥 Carregando cache inicial...');
      await cacheService.forceRefresh();
      console.log('✅ Cache carregado');

      // Serviços já iniciados automaticamente nos construtores:
      // - analyticsService (agenda relatório às 23:55)
      // - cacheService (agenda recarga automática)
      // - sessionService (pronto para uso)

      console.log('\n✅ TODOS OS SERVIÇOS INICIALIZADOS!');

    } catch (error) {
      console.error('❌ Erro na inicialização dos serviços:', error);
      throw error;
    }
  }

  private startServer(): void {
    // O app já tem todas as rotas configuradas
    app.listen(this.port, () => {
      console.log('\n' + '='.repeat(50));
      console.log(`✅ SERVIDOR RODANDO NA PORTA: ${this.port}`);
      console.log(`📅 Data: ${new Date().toLocaleDateString()}`);
      console.log(`⏰ Hora: ${new Date().toLocaleTimeString()}`);
      console.log(`🌍 Ambiente: ${env.NODE_ENV}`);
      console.log('='.repeat(50));
      console.log('\n🎯 ENDPOINTS PRINCIPAIS:');
      console.log(`   📍 POST  http://localhost:${this.port}/api/chatbot/webhook`);
      console.log(`   🩺 GET   http://localhost:${this.port}/api/chatbot/health`);
      console.log(`   📊 GET   http://localhost:${this.port}/api/chatbot/status`);
      console.log(`   📈 GET   http://localhost:${this.port}/api/analytics/today?apiKey=cfc2024analytics`);
      console.log(`   🏠 GET   http://localhost:${this.port}/`);
      console.log('\n🔐 API Key padrão para analytics: "cfc2024analytics"');
      console.log('\n🤖 Aguardando mensagens do WhatsApp...');
    });
  }

  private setupGracefulShutdown(): void {
    const shutdown = async () => {
      console.log('\n🔴 Recebido sinal de desligamento...');
      
      try {
        // Limpar recursos
        cacheService.cleanup();
        sessionService.clearAllSessions();
        
        // Fechar conexão MongoDB
        await mongoose.connection.close();
        console.log('✅ MongoDB desconectado');
        
        console.log('✅ Recursos limpos. Encerrando...');
        process.exit(0);
      } catch (error) {
        console.error('❌ Erro durante shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  }
}

// Iniciar servidor
const server = new Server();
server.start().catch(error => {
  console.error('❌ Falha ao iniciar servidor:', error);
  process.exit(1);
});