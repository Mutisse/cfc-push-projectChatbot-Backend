// src/database/mongodb.ts
import mongoose from 'mongoose';
import config from '../config/app.config';

class MongoDBConnection {
  private static instance: MongoDBConnection;
  private isConnected = false;

  private constructor() {}

  static getInstance(): MongoDBConnection {
    if (!MongoDBConnection.instance) {
      MongoDBConnection.instance = new MongoDBConnection();
    }
    return MongoDBConnection.instance;
  }

  async connect(): Promise<void> {
    if (this.isConnected) {
      console.log('✅ MongoDB já está conectado');
      return;
    }

    try {
      if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI não está definida no .env');
      }

      console.log('🔄 Conectando ao MongoDB Atlas...');
      
      await mongoose.connect(process.env.MONGODB_URI, {
        maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE || '10'),
        serverSelectionTimeoutMS: parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT || '30000'),
        socketTimeoutMS: parseInt(process.env.MONGODB_SOCKET_TIMEOUT || '45000'),
      });

      this.isConnected = true;
      console.log('✅ Conectado ao MongoDB Atlas com sucesso!');
      
      // Event listeners
      mongoose.connection.on('error', (error) => {
        console.error('❌ Erro na conexão MongoDB:', error);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️  MongoDB desconectado');
        this.isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        console.log('🔁 MongoDB reconectado');
        this.isConnected = true;
      });

    } catch (error) {
      console.error('❌ Falha ao conectar ao MongoDB Atlas:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected) return;
    
    try {
      await mongoose.disconnect();
      this.isConnected = false;
      console.log('👋 MongoDB desconectado');
    } catch (error) {
      console.error('❌ Erro ao desconectar MongoDB:', error);
    }
  }

  getConnectionStatus(): { connected: boolean; url?: string; database?: string } {
    if (!this.isConnected) {
      return { connected: false };
    }

    const uri = process.env.MONGODB_URI || '';
    const database = uri.split('/').pop()?.split('?')[0] || 'unknown';
    
    return {
      connected: this.isConnected,
      url: uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'), // Esconde credenciais
      database
    };
  }

  getHealthStatus(): { status: 'healthy' | 'unhealthy'; ping?: number } {
    if (!this.isConnected) {
      return { status: 'unhealthy' };
    }

    return { status: 'healthy' };
  }
}

export const mongodb = MongoDBConnection.getInstance();
export default mongodb;