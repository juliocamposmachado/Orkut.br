# 🚀 API GitHub Activity - Vercel Compatible

API integrada ao Next.js para registrar atividades de usuários e atualizar automaticamente um arquivo no GitHub, com limite de 5 tentativas para evitar loops infinitos.

## ✨ Características

- ✅ **Serverless**: Funciona no Vercel sem configuração adicional
- ✅ **Next.js API Routes**: Endpoints integrados ao framework
- ✅ **TypeScript**: Totalmente tipado
- ✅ **Limite de tentativas**: Máximo 5 tentativas para evitar loops
- ✅ **Hook personalizado**: React Hook para facilitar o uso
- ✅ **Componente de teste**: Interface visual para testar a API
- ✅ **Variáveis do Vercel**: Utiliza as variáveis de ambiente já configuradas

## 📁 Arquivos Criados

### API Routes
- `app/api/user-activity/route.ts` - Endpoint principal (POST/GET)
- `app/api/user-activity-reset/route.ts` - Reset do contador (POST)

### React Components & Hooks
- `hooks/use-github-activity.ts` - Hook personalizado para usar a API
- `components/github-activity-example.tsx` - Componente de teste visual
- `app/test-github-api/page.tsx` - Página de teste da API

## 🔧 Configuração no Vercel

As seguintes variáveis de ambiente devem estar configuradas no Vercel:

```env
GITHUB_TOKEN=seu_token_pessoal_do_github
GITHUB_OWNER=juliocamposmachado
GITHUB_REPO=Orkut-br
GITHUB_FILE_PATH=user-activity.json
```

## 🌐 Endpoints da API

### `POST /api/user-activity`
Registra uma atividade do usuário e atualiza o GitHub.

**Body:**
```json
{
  "userId": "joao123",
  "action": "entrou",
  "data": {
    "comunidade": "Orkut Nostálgico",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

**Resposta (sucesso):**
```json
{
  "success": true,
  "message": "Atividade registrada e página atualizada no GitHub",
  "githubResult": {
    "commitUrl": "https://github.com/user/repo/commit/abc123",
    "sha": "abc123...",
    "message": "Atualização automática: entrou do usuário joao123",
    "timestamp": "2024-01-15T10:30:00Z"
  },
  "attempts": 0
}
```

### `GET /api/user-activity`
Verifica o status atual das tentativas e configuração.

**Resposta:**
```json
{
  "currentAttempts": 2,
  "maxAttempts": 5,
  "canTryAgain": true,
  "lastResetTime": "2024-01-15T10:00:00Z",
  "message": "3 tentativas restantes",
  "environment": {
    "hasGithubToken": true,
    "githubOwner": "juliocamposmachado",
    "githubRepo": "Orkut-br",
    "githubFilePath": "user-activity.json"
  }
}
```

### `POST /api/user-activity-reset`
Reseta o contador de tentativas.

## 🎯 Como Usar

### 1. Via Hook (Recomendado)

```tsx
import { useGithubActivity } from '@/hooks/use-github-activity';

function MeuComponente() {
  const { recordLogin, recordPost, loading, error } = useGithubActivity();

  const handleLogin = async (userId: string) => {
    const result = await recordLogin(userId, {
      platform: 'web'
    });
    
    if (result?.success) {
      console.log('Atividade registrada no GitHub!');
    }
  };

  return (
    <button onClick={() => handleLogin('user123')} disabled={loading}>
      {loading ? 'Registrando...' : 'Fazer Login'}
    </button>
  );
}
```

### 2. Via Fetch Direto

```tsx
const registrarAtividade = async () => {
  const response = await fetch('/api/user-activity', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: 'user123',
      action: 'postou',
      data: {
        titulo: 'Novo post!',
        conteudo: 'Olá pessoal do Orkut!'
      }
    })
  });

  const result = await response.json();
  console.log(result);
};
```

### 3. Página de Teste

Acesse: `https://seu-site.vercel.app/test-github-api`

Interface visual completa para:
- ✅ Testar diferentes tipos de atividade
- ✅ Ver status das tentativas em tempo real
- ✅ Verificar configuração do GitHub
- ✅ Resetar contador quando necessário
- ✅ Ver links dos commits criados

## 🔒 Limitações do Vercel Serverless

- **Estado em memória**: O contador de tentativas não persiste entre deployments
- **Cold starts**: Pode haver delay na primeira execução
- **Recomendação**: Para produção, considere usar um banco de dados ou cache externo (Redis, Upstash, etc.)

## 🎬 Funcionamento

1. **Usuário faz uma ação** (login, post, etc.)
2. **Frontend chama a API** `/api/user-activity`
3. **API incrementa contador** de tentativas
4. **Tenta atualizar GitHub** via Octokit
5. **Se sucesso**: Zera contador e retorna commit URL
6. **Se falha**: Mantém contador e retorna erro
7. **Se 5 tentativas**: Para de tentar até reset

## 📊 Arquivo Gerado no GitHub

O arquivo `user-activity.json` no repositório terá:

```json
{
  "activities": [
    {
      "userId": "joao123",
      "action": "entrou",
      "data": {
        "comunidade": "Orkut Nostálgico"
      },
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ],
  "lastUpdate": "2024-01-15T10:30:00Z"
}
```

## 🚨 Notas Importantes

- ✅ **Sempre funciona**: Mesmo que GitHub falhe, a API responde
- ✅ **Auto-limitante**: Para após 5 tentativas para evitar spam
- ✅ **Seguro**: Variáveis sensíveis ficam no Vercel
- ✅ **Mantém histórico**: Últimas 50 atividades no arquivo
- ⚠️ **Memória**: Estado não persiste entre deployments no Vercel

## 🎯 Casos de Uso

- Registro de logins de usuários
- Tracking de posts em comunidades
- Monitoramento de atividades em tempo real
- Backup de ações importantes
- Análise de engajamento de usuários
