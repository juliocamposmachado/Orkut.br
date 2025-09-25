# API de Atividades Orkut - GitHub

API simples para registrar atividades de usuários (entrou/postou) e atualizar automaticamente um arquivo no GitHub, com limite de 5 tentativas para evitar loops infinitos.

## Características

- ✅ Registra atividades de usuário localmente
- ✅ Atualiza arquivo JSON no GitHub automaticamente  
- ✅ Limite de 5 tentativas para prevenir loops
- ✅ Armazenamento local dos dados como backup
- ✅ Endpoints para monitoramento e controle

## Instalação

```bash
# Entre na pasta da API
cd api

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

## Configuração

1. **Token do GitHub**: Crie um Personal Access Token em: https://github.com/settings/tokens
   - Permissões necessárias: `repo` (Full control of private repositories)

2. **Variáveis de ambiente** (arquivo `.env`):
```env
GITHUB_TOKEN=seu_token_pessoal_do_github
GITHUB_OWNER=seu_usuario_github  
GITHUB_REPO=nome_do_repositorio
GITHUB_FILE_PATH=user-activity.json
PORT=3001
```

## Uso

### Iniciar o servidor
```bash
npm start
```

A API estará disponível em `http://localhost:3001`

### Endpoints

#### `POST /user-activity`
Registra uma atividade do usuário e atualiza o GitHub.

**Exemplo de requisição:**
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

**Exemplo de resposta (sucesso):**
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

#### `GET /status`
Verifica o status atual das tentativas.

**Resposta:**
```json
{
  "currentAttempts": 2,
  "maxAttempts": 5,
  "canTryAgain": true,
  "message": "3 tentativas restantes"
}
```

#### `POST /reset-attempts`
Reseta o contador de tentativas (use com cuidado).

#### `GET /health`
Health check da API.

## Funcionamento

1. **Registro Local**: Toda atividade é salva localmente primeiro
2. **Atualização GitHub**: Tenta atualizar o arquivo no GitHub
3. **Controle de Tentativas**: Conta cada tentativa (máx. 5)
4. **Reset Automático**: Se bem-sucedida, zera o contador
5. **Proteção**: Após 5 tentativas, para de tentar

## Arquivo de Saída no GitHub

O arquivo `user-activity.json` terá esta estrutura:

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

## Testando

Execute o script de exemplo:
```bash
node exemplo-uso.js
```

## Arquivos Criados

- `local-data.json` - Backup local das atividades
- `backup-*.json` - Backups automáticos (se configurado)

## Notas Importantes

- Os dados são sempre salvos localmente, mesmo se o GitHub falhar
- O limite de 5 tentativas evita loops infinitos
- Use `POST /reset-attempts` apenas se necessário
- O arquivo no GitHub mantém apenas os 50 registros mais recentes
