// src/types/index.ts
export interface UserSession {
  id: string;
  phoneNumber: string;
  currentMenuId: string;
  startedAt: Date;
  lastInteraction: Date;
  interactionCount: number;
  status: 'active' | 'completed' | 'abandoned';
  data: Record<string, any>;
}

export interface Interaction {
  id: string;
  sessionId: string;
  phoneNumber: string;
  type: 'user_message' | 'bot_response' | 'menu_access' | 'business_action' | 'session_start' | 'error';
  menuId?: string;
  userInput?: string;
  botResponse?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ChatResult {
  success: boolean;
  message?: string;
  error?: string;
}