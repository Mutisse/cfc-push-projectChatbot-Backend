db = db.getSiblingDB('monitoring');

// Criar usuário da aplicação
db.createUser({
  user: 'monitoring_user',
  pwd: 'monitoring_password',
  roles: [
    { role: 'readWrite', db: 'monitoring' },
    { role: 'dbAdmin', db: 'monitoring' }
  ]
});

// Criar coleções iniciais
db.createCollection('services');
db.createCollection('alerts');
db.createCollection('metrics');
db.createCollection('logs');

// Criar índices
db.services.createIndex({ name: 1 }, { unique: true });
db.services.createIndex({ status: 1 });
db.services.createIndex({ environment: 1 });
db.services.createIndex({ isMonitored: 1 });

db.alerts.createIndex({ service: 1 });
db.alerts.createIndex({ status: 1 });
db.alerts.createIndex({ severity: 1 });
db.alerts.createIndex({ createdAt: -1 });

db.metrics.createIndex({ service: 1, metricType: 1, timestamp: -1 });
db.metrics.createIndex({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 }); // 90 dias

db.logs.createIndex({ timestamp: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 }); // 30 dias
db.logs.createIndex({ level: 1 });
db.logs.createIndex({ source: 1 });
db.logs.createIndex({ service: 1 });
db.logs.createIndex({ message: 'text' });

print('✅ MongoDB initialized successfully');