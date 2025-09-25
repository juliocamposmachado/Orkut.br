const express = require('express');
const { updateGitHubPage } = require('./github');
const { getAttemptCount, incrementAttemptCount, resetAttemptCount, recordUserActivity } = require('./store');

const app = express();
app.use(express.json());

const MAX_ATTEMPTS = 5;

// Endpoint para registrar atividade do usuário e atualizar página
app.post('/user-activity', async (req, res) => {
  try {
    const { userId, action, data } = req.body;
    
    if (!userId || !action) {
      return res.status(400).json({ error: 'userId e action são obrigatórios' });
    }

    // Verifica se já excedeu o limite de tentativas
    const attemptCount = getAttemptCount();
    if (attemptCount >= MAX_ATTEMPTS) {
      return res.status(429).json({ 
        error: 'Limite de tentativas excedido',
        message: `Máximo de ${MAX_ATTEMPTS} tentativas atingido. Aguarde antes de tentar novamente.`,
        attempts: attemptCount
      });
    }

    // Registra a atividade do usuário no armazenamento local
    recordUserActivity(userId, action, data);

    // Tenta atualizar a página no GitHub
    try {
      incrementAttemptCount();
      const result = await updateGitHubPage(userId, action, data);
      
      // Se chegou aqui, a atualização foi bem-sucedida
      resetAttemptCount();
      
      return res.json({
        success: true,
        message: 'Atividade registrada e página atualizada no GitHub',
        githubResult: result,
        attempts: getAttemptCount()
      });

    } catch (githubError) {
      console.error('Erro ao atualizar GitHub:', githubError.message);
      
      const currentAttempts = getAttemptCount();
      
      if (currentAttempts >= MAX_ATTEMPTS) {
        return res.status(500).json({
          error: 'Falha na atualização do GitHub',
          message: `Limite de ${MAX_ATTEMPTS} tentativas excedido. Parando as tentativas.`,
          attempts: currentAttempts,
          localDataSaved: true
        });
      }

      return res.status(500).json({
        error: 'Falha na atualização do GitHub',
        message: githubError.message,
        attempts: currentAttempts,
        localDataSaved: true,
        willRetry: currentAttempts < MAX_ATTEMPTS
      });
    }

  } catch (error) {
    console.error('Erro interno:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

// Endpoint para verificar status das tentativas
app.get('/status', (req, res) => {
  const attempts = getAttemptCount();
  
  res.json({
    currentAttempts: attempts,
    maxAttempts: MAX_ATTEMPTS,
    canTryAgain: attempts < MAX_ATTEMPTS,
    message: attempts >= MAX_ATTEMPTS 
      ? 'Limite de tentativas excedido' 
      : `${MAX_ATTEMPTS - attempts} tentativas restantes`
  });
});

// Endpoint para resetar contador (use com cuidado)
app.post('/reset-attempts', (req, res) => {
  resetAttemptCount();
  res.json({
    message: 'Contador de tentativas resetado',
    currentAttempts: getAttemptCount()
  });
});

// Endpoint de health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API rodando na porta ${PORT}`);
  console.log(`Limite máximo de tentativas: ${MAX_ATTEMPTS}`);
});
