// src/services/Database.ts
import mongoose from 'mongoose';
import config from '../config';

class Database {
  private static instance: Database;
  private isConnected = false;

  private constructor() {}

  static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  async connect(): Promise<void> {
    if (this.isConnected) {
      console.log('✅ MongoDB already connected');
      return;
    }

    try {
      const mongoURI = config.MONGO.URI;
      const dbName = config.MONGO.DB_NAME;
      
      await mongoose.connect(mongoURI, {
        ...config.MONGO.OPTIONS,
        dbName
      });

      this.isConnected = true;
      console.log(`✅ MongoDB connected successfully to database: ${dbName}`);
      
      // Event listeners
      mongoose.connection.on('error', (error) => {
        console.error('❌ MongoDB connection error:', error);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        console.log('⚠️ MongoDB disconnected');
        this.isConnected = false;
      });

      process.on('SIGINT', async () => {
        await this.disconnect();
        console.log('🛑 MongoDB connection closed through app termination');
        process.exit(0);
      });

    } catch (error) {
      console.error('❌ Error connecting to MongoDB:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected) return;
    
    try {
      await mongoose.disconnect();
      this.isConnected = false;
      console.log('🛑 MongoDB disconnected successfully');
    } catch (error) {
      console.error('❌ Error disconnecting from MongoDB:', error);
      throw error;
    }
  }

  getConnection(): mongoose.Connection {
    return mongoose.connection;
  }

  isConnectedToDB(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  // Método utilitário para health check
  async healthCheck(): Promise<boolean> {
    if (!this.isConnectedToDB()) {
      return false;
    }
    
    try {
      // Executar um comando simples para verificar
      await mongoose.connection.db.command({ ping: 1 });
      return true;
    } catch {
      return false;
    }
  }
}

export default Database;