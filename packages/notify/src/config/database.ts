import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cfcpush_notifications';

export const connectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Notifications Database conectado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao conectar com Notifications Database:', error);
    process.exit(1);
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log('📦 Notifications Database desconectado');
  } catch (error) {
    console.error('❌ Erro ao desconectar database:', error);
  }
};