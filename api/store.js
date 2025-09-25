const fs = require('fs');
const path = require('path');

// Arquivo para armazenar dados localmente
const DATA_FILE = path.join(__dirname, 'local-data.json');

// Estrutura de dados padrão
const DEFAULT_DATA = {
  attemptCount: 0,
  lastResetTime: new Date().toISOString(),
  activities: []
};

// Função para ler dados do arquivo
function readData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.error('Erro ao ler dados locais:', error.message);
  }
  
  // Retorna dados padrão se não conseguiu ler
  return { ...DEFAULT_DATA };
}

// Função para escrever dados no arquivo
function writeData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Erro ao escrever dados locais:', error.message);
    return false;
  }
}

// Obtém o número atual de tentativas
function getAttemptCount() {
  const data = readData();
  return data.attemptCount || 0;
}

// Incrementa o contador de tentativas
function incrementAttemptCount() {
  const data = readData();
  data.attemptCount = (data.attemptCount || 0) + 1;
  data.lastAttemptTime = new Date().toISOString();
  
  writeData(data);
  console.log(`Tentativa ${data.attemptCount} registrada`);
  
  return data.attemptCount;
}

// Reseta o contador de tentativas
function resetAttemptCount() {
  const data = readData();
  data.attemptCount = 0;
  data.lastResetTime = new Date().toISOString();
  
  writeData(data);
  console.log('Contador de tentativas resetado');
  
  return 0;
}

// Registra uma atividade de usuário
function recordUserActivity(userId, action, activityData) {
  const data = readData();
  
  if (!data.activities) {
    data.activities = [];
  }
  
  const activity = {
    userId,
    action,
    data: activityData,
    timestamp: new Date().toISOString(),
    id: generateId()
  };
  
  data.activities.push(activity);
  
  // Mantém apenas os últimos 100 registros localmente
  if (data.activities.length > 100) {
    data.activities = data.activities.slice(-100);
  }
  
  writeData(data);
  console.log(`Atividade registrada: ${action} para usuário ${userId}`);
  
  return activity;
}

// Obtém todas as atividades registradas localmente
function getActivities() {
  const data = readData();
  return data.activities || [];
}

// Obtém atividades de um usuário específico
function getUserActivities(userId) {
  const activities = getActivities();
  return activities.filter(activity => activity.userId === userId);
}

// Obtém estatísticas
function getStats() {
  const data = readData();
  const activities = data.activities || [];
  
  const stats = {
    totalActivities: activities.length,
    attemptCount: data.attemptCount || 0,
    lastResetTime: data.lastResetTime,
    lastAttemptTime: data.lastAttemptTime,
    uniqueUsers: [...new Set(activities.map(a => a.userId))].length,
    actionCounts: {}
  };
  
  // Conta ações por tipo
  activities.forEach(activity => {
    const action = activity.action;
    stats.actionCounts[action] = (stats.actionCounts[action] || 0) + 1;
  });
  
  return stats;
}

// Limpa dados antigos (opcional)
function cleanOldData(daysOld = 7) {
  const data = readData();
  if (!data.activities) return;
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  const initialCount = data.activities.length;
  data.activities = data.activities.filter(activity => {
    const activityDate = new Date(activity.timestamp);
    return activityDate > cutoffDate;
  });
  
  const removedCount = initialCount - data.activities.length;
  if (removedCount > 0) {
    writeData(data);
    console.log(`Removidos ${removedCount} registros antigos`);
  }
  
  return removedCount;
}

// Gera um ID único simples
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Função para backup dos dados
function backupData() {
  try {
    const data = readData();
    const backupFile = path.join(__dirname, `backup-${Date.now()}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Backup criado: ${backupFile}`);
    return backupFile;
  } catch (error) {
    console.error('Erro ao criar backup:', error.message);
    return null;
  }
}

module.exports = {
  getAttemptCount,
  incrementAttemptCount,
  resetAttemptCount,
  recordUserActivity,
  getActivities,
  getUserActivities,
  getStats,
  cleanOldData,
  backupData
};
