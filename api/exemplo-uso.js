// Exemplo de como usar a API
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001';

// Exemplos de uso da API
async function exemploDeUso() {
  try {
    console.log('=== Teste da API de Atividades ===\n');

    // 1. Verificar status inicial
    console.log('1. Verificando status:');
    const status = await axios.get(`${API_BASE_URL}/status`);
    console.log(status.data);
    console.log();

    // 2. Registrar atividade de entrada
    console.log('2. Registrando entrada do usuário:');
    const entradaResponse = await axios.post(`${API_BASE_URL}/user-activity`, {
      userId: 'joao123',
      action: 'entrou',
      data: {
        comunidade: 'Orkut Nostálgico',
        timestamp: new Date().toISOString()
      }
    });
    console.log(entradaResponse.data);
    console.log();

    // 3. Registrar atividade de postagem
    console.log('3. Registrando postagem:');
    const postagemResponse = await axios.post(`${API_BASE_URL}/user-activity`, {
      userId: 'joao123',
      action: 'postou',
      data: {
        comunidade: 'Orkut Nostálgico',
        titulo: 'Lembranças dos anos 2000!',
        conteudo: 'Alguém mais sente falta daquela época?',
        timestamp: new Date().toISOString()
      }
    });
    console.log(postagemResponse.data);
    console.log();

    // 4. Verificar status após atividades
    console.log('4. Status após atividades:');
    const statusFinal = await axios.get(`${API_BASE_URL}/status`);
    console.log(statusFinal.data);

  } catch (error) {
    console.error('Erro:', error.response ? error.response.data : error.message);
  }
}

// Teste de limite de tentativas
async function testeLimiteTentativas() {
  console.log('\n=== Teste do Limite de Tentativas ===\n');

  // Simula várias tentativas rapidamente para testar o limite
  for (let i = 1; i <= 7; i++) {
    try {
      console.log(`Tentativa ${i}:`);
      const response = await axios.post(`${API_BASE_URL}/user-activity`, {
        userId: `usuario${i}`,
        action: 'teste_limite',
        data: { tentativa: i }
      });
      console.log(`✓ Sucesso: ${response.data.message}`);
    } catch (error) {
      const errorData = error.response.data;
      console.log(`✗ Erro: ${errorData.message}`);
      
      if (errorData.attempts >= 5) {
        console.log('Limite atingido, parando teste');
        break;
      }
    }
    console.log();
  }
}

// Função principal
async function main() {
  // Aguarda um pouco para ter certeza que o servidor está rodando
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Primeiro testa o uso normal
  await exemploDeUso();

  // Depois testa o limite (descomente se quiser testar)
  // await testeLimiteTentativas();
}

// Executa apenas se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  exemploDeUso,
  testeLimiteTentativas
};
