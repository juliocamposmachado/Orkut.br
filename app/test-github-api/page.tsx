import { GitHubActivityExample } from '@/components/github-activity-example';

export default function TestGitHubAPI() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Teste da API GitHub Activity
            </h1>
            <p className="text-lg text-gray-600">
              Interface para testar a integração com GitHub que registra atividades de usuários
            </p>
          </div>
          
          <GitHubActivityExample />
        </div>
      </div>
    </div>
  );
}
