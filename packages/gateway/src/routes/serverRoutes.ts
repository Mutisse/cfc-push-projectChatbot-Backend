import { Router } from 'express';
import serverManager from '../services/serverManager';

const router = Router();

// Listar todos os servidores
router.get('/servers', (req, res) => {
  res.json({
    servers: serverManager.getServerStatuses(),
    timestamp: new Date().toISOString()
  });
});

// Verificar saúde de um servidor específico
router.get('/servers/:key/health', async (req, res) => {
  try {
    const { key } = req.params;
    const status = await serverManager.checkServerHealth(key);
    res.json(status);
  } catch (error) {
    res.status(404).json({
      error: 'Server not found',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Adicionar novo servidor (apenas desenvolvimento)
router.post('/servers', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Cannot add servers in production mode'
    });
    return;
  }

  try {
    const { key, config: serverConfig } = req.body;
    if (!key || !serverConfig) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Key and config are required'
      });
      return;
    }

    serverManager.addServer(key, serverConfig);
    res.status(201).json({
      message: 'Server added successfully',
      key,
      config: serverConfig
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to add server',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Relatório completo
router.get('/report', (req, res) => {
  res.json(serverManager.generateReport());
});

export default router;