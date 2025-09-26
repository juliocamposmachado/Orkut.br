#!/usr/bin/env node

/**
 * Script para preparar o projeto para deploy no Vercel
 */

console.log('🚀 PREPARANDO PROJETO PARA DEPLOY NO VERCEL\n')

import { execSync } from 'child_process'
import fs from 'fs'

const steps = [
  {
    name: 'Verificar se build passa',
    action: () => {
      console.log('🔨 Executando build...')
      execSync('npm run build', { stdio: 'inherit' })
    }
  },
  {
    name: 'Limpar arquivos temporários',
    action: () => {
      console.log('🧹 Limpando arquivos temporários...')
      
      // Remover arquivos de teste que não são necessários
      const filesToRemove = [
        'test-friendship-accept-api.mjs',
        'test-friendship-fixes.mjs', 
        'test-final-friendship-api.mjs',
        'debug-friendships.mjs',
        'apply-friendship-fixes.mjs'
      ]
      
      filesToRemove.forEach(file => {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file)
          console.log(`✅ Removido: ${file}`)
        }
      })
    }
  },
  {
    name: 'Verificar .env.local',
    action: () => {
      console.log('🔍 Verificando variáveis de ambiente...')
      
      if (!fs.existsSync('.env.local')) {
        console.log('❌ .env.local não encontrado!')
        console.log('⚠️ Certifique-se de configurar no Vercel Dashboard:')
        console.log('   - NEXT_PUBLIC_SUPABASE_URL')
        console.log('   - NEXT_PUBLIC_SUPABASE_ANON_KEY') 
        console.log('   - SUPABASE_SERVICE_ROLE_KEY')
        return
      }
      
      const envContent = fs.readFileSync('.env.local', 'utf8')
      const requiredVars = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY'
      ]
      
      let allPresent = true
      requiredVars.forEach(varName => {
        if (envContent.includes(varName)) {
          console.log(`✅ ${varName}`)
        } else {
          console.log(`❌ ${varName} faltando`)
          allPresent = false
        }
      })
      
      if (allPresent) {
        console.log('✅ Todas as variáveis estão presentes')
      } else {
        console.log('⚠️ Configure as variáveis faltantes no Vercel Dashboard')
      }
    }
  },
  {
    name: 'Verificar package.json',
    action: () => {
      console.log('📦 Verificando package.json...')
      
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
      
      if (packageJson.scripts?.build) {
        console.log('✅ Script de build presente')
      } else {
        console.log('❌ Script de build faltando')
      }
      
      if (packageJson.scripts?.start) {
        console.log('✅ Script de start presente')
      } else {
        console.log('❌ Script de start faltando')
      }
    }
  },
  {
    name: 'Criar arquivo de configuração do Vercel',
    action: () => {
      console.log('⚙️ Criando vercel.json...')
      
      const vercelConfig = {
        "buildCommand": "npm run build",
        "outputDirectory": ".next",
        "framework": "nextjs",
        "env": {
          "NEXT_PUBLIC_SUPABASE_URL": "@next_public_supabase_url",
          "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@next_public_supabase_anon_key", 
          "SUPABASE_SERVICE_ROLE_KEY": "@supabase_service_role_key"
        },
        "functions": {
          "app/api/**/*.ts": {
            "maxDuration": 30
          }
        },
        "regions": ["gru1"]
      }
      
      fs.writeFileSync('vercel.json', JSON.stringify(vercelConfig, null, 2))
      console.log('✅ vercel.json criado')
    }
  },
  {
    name: 'Verificar .gitignore',
    action: () => {
      console.log('🔒 Verificando .gitignore...')
      
      let gitignoreContent = ''
      if (fs.existsSync('.gitignore')) {
        gitignoreContent = fs.readFileSync('.gitignore', 'utf8')
      }
      
      const requiredIgnores = [
        '.env.local',
        '.env*.local', 
        'node_modules/',
        '.next/',
        'out/',
        'build/'
      ]
      
      let needsUpdate = false
      requiredIgnores.forEach(item => {
        if (!gitignoreContent.includes(item)) {
          gitignoreContent += `\n${item}`
          needsUpdate = true
          console.log(`✅ Adicionado ao .gitignore: ${item}`)
        }
      })
      
      if (needsUpdate) {
        fs.writeFileSync('.gitignore', gitignoreContent)
        console.log('✅ .gitignore atualizado')
      } else {
        console.log('✅ .gitignore está correto')
      }
    }
  }
]

// Executar todos os steps
let success = 0
let total = steps.length

for (let i = 0; i < steps.length; i++) {
  const step = steps[i]
  console.log(`\n${i + 1}️⃣ ${step.name}`)
  console.log('─'.repeat(50))
  
  try {
    step.action()
    success++
    console.log('✅ Concluído')
  } catch (error) {
    console.log('❌ Erro:', error.message)
  }
}

// Resumo final
console.log('\n📊 RESUMO:')
console.log('─'.repeat(50))
console.log(`✅ ${success}/${total} etapas concluídas`)

if (success === total) {
  console.log('\n🎉 PROJETO PRONTO PARA DEPLOY!')
  console.log('\n📋 PRÓXIMOS PASSOS:')
  console.log('1. git add .')
  console.log('2. git commit -m "Preparar para deploy - corrigir sistema amizades"') 
  console.log('3. git push origin main')
  console.log('4. Configurar variáveis de ambiente no Vercel Dashboard')
  console.log('5. Deploy automático será realizado')
  
  console.log('\n🔑 LEMBRE-SE: Configure no Vercel Dashboard:')
  console.log('- NEXT_PUBLIC_SUPABASE_URL')
  console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY')
  console.log('- SUPABASE_SERVICE_ROLE_KEY')
  
} else {
  console.log('\n⚠️ Alguns problemas encontrados. Corrija antes do deploy.')
}

console.log('\n🚀 Happy coding!')
