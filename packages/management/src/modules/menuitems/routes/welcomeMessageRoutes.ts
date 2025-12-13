// src/routes/welcomeMessageRoutes.ts
import { Router, Request, Response } from 'express'; // ✅ TIPOS ADICIONADOS
import { WelcomeMessageController } from '../controllers/welcomeMessageController';

const router = Router();
const welcomeMessageController = new WelcomeMessageController();

// ==================== ROTA DE DOCUMENTAÇÃO ====================
router.get("/docs", (req: Request, res: Response) => {  // ✅ TIPOS ADICIONADOS
  res.json({
    service: "CFC Push Management API - Welcome Messages Module", 
    version: "1.0.0",
    status: "operational",
    description: "Sistema de gestão de mensagens de boas-vindas para o chatbot CFC Push",
    endpoints: {
      // 📋 CONSULTA E LISTAGEM
      read: {
        active: "GET /api/management/welcome/active",
        all: "GET /api/management/welcome",
        deleted: "GET /api/management/welcome/deleted", 
        byId: "GET /api/management/welcome/:id"
      },
      // ➕ CRIAÇÃO
      create: {
        new: "POST /api/management/welcome"
      },
      // ✏️ ATUALIZAÇÃO  
      update: {
        basic: "PUT /api/management/welcome/:id",
        status: "PATCH /api/management/welcome/:id/status",
        restore: "PATCH /api/management/welcome/:id/restore"
      },
      // 🗑️ EXCLUSÃO
      delete: {
        soft: "DELETE /api/management/welcome/:id"
      }
    },
    message_system: {
      single_active: "Apenas uma mensagem pode estar ativa por vez",
      version_control: "Mantém histórico de todas as versões",
      soft_delete: "Arquivamento com possibilidade de restauração"
    },
    message_status: {
      active: "Mensagem atual exibida aos usuários",
      inactive: "Mensagem arquivada (histórico)"
    },
    examples: {
      create_message: {
        method: "POST",
        url: "/api/management/welcome",
        body: {
          title: "🏛️ Bem-vindo à CFC Push!",
          content: "Olá! Sou o assistente virtual da Igreja da Família Cristã CFC Push. Estou aqui para te ajudar! 🙏",
          buttons: [
            {
              text: "📝 Fazer Registro",
              action: "register"
            },
            {
              text: "🙏 Pedido de Oração", 
              action: "prayer"
            },
            {
              text: "📅 Eventos",
              action: "events"
            }
          ],
          isActive: true,
          version: "2.1.0"
        }
      },
      activate_message: {
        method: "PATCH",
        url: "/api/management/welcome/507f1f77bcf86cd799439011/status",
        body: {
          isActive: true
        }
      }
    },
    features: [
      "Sistema de versões para controle de mudanças",
      "Apenas uma mensagem ativa por vez (ativação automática desativa outras)",
      "Botões de ação personalizáveis", 
      "Histórico completo de todas as mensagens",
      "Soft delete com restauração"
    ],
    notes: [
      "Ao ativar uma mensagem, todas as outras são automaticamente desativadas",
      "Mensagens deletadas podem ser restauradas",
      "O campo 'version' ajuda no controle de mudanças"
    ]
  });
});

// ==================== ROTAS DE CONSULTA ====================

// GET routes
router.get('/', welcomeMessageController.getAllMessages);
router.get('/active', welcomeMessageController.getActiveMessage);
router.get('/deleted', welcomeMessageController.getDeletedMessages);
router.get('/:id', welcomeMessageController.getMessageById);

// ==================== ROTAS DE CRIAÇÃO ====================

// POST routes
router.post('/', welcomeMessageController.createMessage);

// ==================== ROTAS DE ATUALIZAÇÃO ====================

// PUT routes
router.put('/:id', welcomeMessageController.updateMessage);

// PATCH routes
router.patch('/:id/restore', welcomeMessageController.restoreMessage);
router.patch('/:id/status', welcomeMessageController.toggleMessageActive);

// ==================== ROTAS DE EXCLUSÃO ====================

// DELETE routes (soft delete)
router.delete('/:id', welcomeMessageController.deleteMessage);

export default router;