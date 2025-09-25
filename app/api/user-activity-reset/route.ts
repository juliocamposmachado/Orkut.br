import { NextResponse } from 'next/server';

// Variável compartilhada (limitação do Vercel serverless)
// Em produção, use um banco de dados ou cache externo
declare global {
  var attemptCount: number | undefined;
}

export async function POST() {
  try {
    // Reset do contador global
    global.attemptCount = 0;
    
    return NextResponse.json({
      message: 'Contador de tentativas resetado',
      currentAttempts: 0,
      resetTime: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Erro ao resetar contador:', error);
    return NextResponse.json({
      error: 'Erro interno do servidor',
      message: error.message
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST para resetar o contador de tentativas'
  }, { status: 405 });
}
