import { NextRequest, NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';

// Configuração com as variáveis do Vercel
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const OWNER = process.env.GITHUB_OWNER;
const REPO = process.env.GITHUB_REPO;
const FILE_PATH = process.env.GITHUB_FILE_PATH || 'user-activity.json';
const MAX_ATTEMPTS = 5;

// Store em memória (limitado no Vercel, mas funciona para testes)
// Em produção, use um banco de dados ou cache externo
let attemptCount = 0;
let lastResetTime = new Date().toISOString();

interface UserActivity {
  userId: string;
  action: string;
  data?: any;
  timestamp: string;
}

interface GitHubActivityFile {
  activities: UserActivity[];
  lastUpdate: string;
}

async function updateGitHubFile(userId: string, action: string, data: any): Promise<any> {
  try {
    if (!process.env.GITHUB_TOKEN || !OWNER || !REPO) {
      throw new Error('Configuração GitHub incompleta. Verifique as variáveis de ambiente no Vercel');
    }

    // Tenta obter o arquivo existente
    let existingContent: GitHubActivityFile = { activities: [], lastUpdate: '' };
    let sha: string | null = null;

    try {
      const { data: fileData } = await octokit.rest.repos.getContent({
        owner: OWNER!,
        repo: REPO!,
        path: FILE_PATH,
      });

      if ('content' in fileData && fileData.content) {
        const decodedContent = Buffer.from(fileData.content, 'base64').toString('utf8');
        existingContent = JSON.parse(decodedContent);
        sha = fileData.sha;
      }
    } catch (error: any) {
      if (error.status !== 404) {
        throw error;
      }
      // Arquivo não existe, será criado
      console.log(`Arquivo ${FILE_PATH} não existe, será criado`);
    }

    // Prepara os novos dados
    const timestamp = new Date().toISOString();
    const activityEntry: UserActivity = {
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

    // Mantém apenas os últimos 50 registros
    if (existingContent.activities.length > 50) {
      existingContent.activities = existingContent.activities.slice(-50);
    }

    const newContent = JSON.stringify(existingContent, null, 2);
    const encodedContent = Buffer.from(newContent, 'utf8').toString('base64');

    // Cria ou atualiza o arquivo
    const commitMessage = `Atualização automática: ${action} do usuário ${userId}`;
    
    const result = await octokit.rest.repos.createOrUpdateFileContents({
      owner: OWNER!,
      repo: REPO!,
      path: FILE_PATH,
      message: commitMessage,
      content: encodedContent,
      sha: sha || undefined,
    });

    console.log(`GitHub atualizado: ${result.data.commit.html_url}`);
    
    return {
      commitUrl: result.data.commit.html_url,
      sha: result.data.content?.sha,
      message: commitMessage,
      timestamp
    };

  } catch (error: any) {
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, action, data } = body;
    
    if (!userId || !action) {
      return NextResponse.json(
        { error: 'userId e action são obrigatórios' },
        { status: 400 }
      );
    }

    // Verifica se já excedeu o limite de tentativas
    if (attemptCount >= MAX_ATTEMPTS) {
      return NextResponse.json({
        error: 'Limite de tentativas excedido',
        message: `Máximo de ${MAX_ATTEMPTS} tentativas atingido. Aguarde antes de tentar novamente.`,
        attempts: attemptCount
      }, { status: 429 });
    }

    // Tenta atualizar a página no GitHub
    try {
      attemptCount++;
      const result = await updateGitHubFile(userId, action, data);
      
      // Se chegou aqui, a atualização foi bem-sucedida
      attemptCount = 0;
      lastResetTime = new Date().toISOString();
      
      return NextResponse.json({
        success: true,
        message: 'Atividade registrada e página atualizada no GitHub',
        githubResult: result,
        attempts: attemptCount
      });

    } catch (githubError: any) {
      console.error('Erro ao atualizar GitHub:', githubError.message);
      
      if (attemptCount >= MAX_ATTEMPTS) {
        return NextResponse.json({
          error: 'Falha na atualização do GitHub',
          message: `Limite de ${MAX_ATTEMPTS} tentativas excedido. Parando as tentativas.`,
          attempts: attemptCount,
          localDataSaved: false // No Vercel serverless, não temos persistência local
        }, { status: 500 });
      }

      return NextResponse.json({
        error: 'Falha na atualização do GitHub',
        message: githubError.message,
        attempts: attemptCount,
        localDataSaved: false,
        willRetry: attemptCount < MAX_ATTEMPTS
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Erro interno:', error);
    return NextResponse.json({
      error: 'Erro interno do servidor',
      message: error.message
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    currentAttempts: attemptCount,
    maxAttempts: MAX_ATTEMPTS,
    canTryAgain: attemptCount < MAX_ATTEMPTS,
    lastResetTime: lastResetTime,
    message: attemptCount >= MAX_ATTEMPTS 
      ? 'Limite de tentativas excedido' 
      : `${MAX_ATTEMPTS - attemptCount} tentativas restantes`,
    environment: {
      hasGithubToken: !!process.env.GITHUB_TOKEN,
      githubOwner: process.env.GITHUB_OWNER,
      githubRepo: process.env.GITHUB_REPO,
      githubFilePath: FILE_PATH
    }
  });
}
