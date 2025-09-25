const { Octokit } = require('@octokit/rest');
require('dotenv').config();

// Configuração do GitHub
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const OWNER = process.env.GITHUB_OWNER;
const REPO = process.env.GITHUB_REPO;
const FILE_PATH = process.env.GITHUB_FILE_PATH || 'user-activity.json';

async function updateGitHubPage(userId, action, data) {
  try {
    if (!process.env.GITHUB_TOKEN || !OWNER || !REPO) {
      throw new Error('Configuração GitHub incompleta. Verifique GITHUB_TOKEN, GITHUB_OWNER e GITHUB_REPO');
    }

    // Primeiro, tenta obter o arquivo existente
    let existingContent = {};
    let sha = null;

    try {
      const { data: fileData } = await octokit.rest.repos.getContent({
        owner: OWNER,
        repo: REPO,
        path: FILE_PATH,
      });

      if (fileData.content) {
        const decodedContent = Buffer.from(fileData.content, 'base64').toString('utf8');
        existingContent = JSON.parse(decodedContent);
        sha = fileData.sha;
      }
    } catch (error) {
      if (error.status !== 404) {
        throw error;
      }
      // Arquivo não existe, será criado
      console.log(`Arquivo ${FILE_PATH} não existe, será criado`);
    }

    // Prepara os novos dados
    const timestamp = new Date().toISOString();
    const activityEntry = {
      userId,
      action,
      data,
      timestamp
    };

    // Atualiza o conteúdo
    if (!existingContent.activities) {
      existingContent.activities = [];
    }

    existingContent.activities.push(activityEntry);
    existingContent.lastUpdate = timestamp;

    // Mantém apenas os últimos 50 registros para não fazer o arquivo ficar muito grande
    if (existingContent.activities.length > 50) {
      existingContent.activities = existingContent.activities.slice(-50);
    }

    const newContent = JSON.stringify(existingContent, null, 2);
    const encodedContent = Buffer.from(newContent, 'utf8').toString('base64');

    // Cria ou atualiza o arquivo
    const commitMessage = `Atualização automática: ${action} do usuário ${userId}`;
    
    const result = await octokit.rest.repos.createOrUpdateFileContents({
      owner: OWNER,
      repo: REPO,
      path: FILE_PATH,
      message: commitMessage,
      content: encodedContent,
      sha, // null se for novo arquivo
    });

    console.log(`GitHub atualizado com sucesso: ${result.data.commit.html_url}`);
    
    return {
      commitUrl: result.data.commit.html_url,
      sha: result.data.content.sha,
      message: commitMessage,
      timestamp
    };

  } catch (error) {
    console.error('Erro ao atualizar GitHub:', error);
    
    // Melhora as mensagens de erro
    if (error.status === 401) {
      throw new Error('Token do GitHub inválido ou sem permissões');
    } else if (error.status === 403) {
      throw new Error('Sem permissão para acessar o repositório GitHub');
    } else if (error.status === 404) {
      throw new Error('Repositório ou arquivo não encontrado no GitHub');
    } else if (error.code === 'ENOTFOUND') {
      throw new Error('Erro de conectividade com GitHub');
    }
    
    throw new Error(`Erro GitHub: ${error.message}`);
  }
}

// Função para testar a conexão com GitHub
async function testGitHubConnection() {
  try {
    await octokit.rest.users.getAuthenticated();
    console.log('Conexão com GitHub OK');
    return true;
  } catch (error) {
    console.error('Erro na conexão GitHub:', error.message);
    return false;
  }
}

module.exports = {
  updateGitHubPage,
  testGitHubConnection
};
