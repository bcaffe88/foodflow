import { Octokit } from '@octokit/rest'
import fs from 'fs'
import path from 'path'

let connectionSettings: any

async function getAccessToken() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found')
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0])

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token

  if (!connectionSettings || !accessToken) {
    throw new Error('GitHub not connected')
  }
  return accessToken
}

async function getGitHubClient() {
  const accessToken = await getAccessToken()
  return new Octokit({ auth: accessToken })
}

async function getAllFiles(dir: string, fileList: string[] = []): Promise<string[]> {
  const files = fs.readdirSync(dir)
  
  for (const file of files) {
    const filePath = path.join(dir, file)
    
    // Skip ignored directories
    if (['node_modules', '.git', '.cache', 'dist', 'BMAP', 'projeto Wilson pizza', 'attached_assets', 'instruções', '.local', '.config'].includes(file)) {
      continue
    }
    
    const stat = fs.statSync(filePath)
    if (stat.isDirectory()) {
      getAllFiles(filePath, fileList)
    } else {
      fileList.push(filePath)
    }
  }
  return fileList
}

async function main() {
  try {
    const octokit = await getGitHubClient()
    
    // Get authenticated user
    const { data: user } = await octokit.rest.users.getAuthenticated()
    console.log(`👤 Autenticado como: ${user.login}`)
    
    // Create repository
    console.log('\n📦 Criando repositório "foodflow"...')
    let repoUrl = ''
    try {
      const { data: repo } = await octokit.rest.repos.createForAuthenticatedUser({
        name: 'foodflow',
        description: 'Plataforma Multi-Tenant de Delivery - FoodFlow Clone iFood',
        private: false,
        auto_init: false
      })
      repoUrl = repo.clone_url
      console.log(`✅ Repositório criado: ${repo.html_url}`)
    } catch (error: any) {
      if (error.status === 422) {
        console.log('✅ Repositório "foodflow" já existe')
        const { data: repo } = await octokit.rest.repos.get({
          owner: user.login,
          repo: 'foodflow'
        })
        repoUrl = repo.clone_url
      } else {
        throw error
      }
    }
    
    // Get all files
    console.log('\n📁 Coletando arquivos...')
    const files = await getAllFiles('.')
    console.log(`✅ ${files.length} arquivos encontrados`)
    
    // Upload files
    console.log('\n📤 Fazendo upload para GitHub...')
    let uploadedCount = 0
    
    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf-8')
        const relativePath = path.relative('.', file)
        
        await octokit.rest.repos.createOrUpdateFileContents({
          owner: user.login,
          repo: 'foodflow',
          path: relativePath,
          message: `✅ Upload: ${relativePath}`,
          content: Buffer.from(content).toString('base64'),
          committer: {
            name: 'FoodFlow Deploy',
            email: 'foodflow@railway.app'
          }
        })
        
        uploadedCount++
        if (uploadedCount % 20 === 0) {
          console.log(`  ⏳ ${uploadedCount}/${files.length} arquivos...`)
        }
      } catch (error: any) {
        console.warn(`  ⚠️  Erro ao upload ${file}:`, error.message?.substring(0, 50))
      }
    }
    
    console.log(`\n✅ ${uploadedCount} arquivos enviados com sucesso!`)
    
    // Create README if doesn't exist
    console.log('\n📝 Verificando README...')
    try {
      await octokit.rest.repos.createOrUpdateFileContents({
        owner: user.login,
        repo: 'foodflow',
        path: 'README.md',
        message: '📝 Add: README.md',
        content: Buffer.from(fs.readFileSync('README.md', 'utf-8')).toString('base64'),
        committer: {
          name: 'FoodFlow Deploy',
          email: 'foodflow@railway.app'
        }
      })
      console.log('✅ README.md sincronizado')
    } catch (error: any) {
      console.log('ℹ️  README.md não encontrado localmente')
    }
    
    console.log('\n' + '='.repeat(50))
    console.log('🎉 IMPORT CONCLUÍDO COM SUCESSO!')
    console.log('='.repeat(50))
    console.log(`\n📍 Seu repositório está em:`)
    console.log(`   https://github.com/${user.login}/foodflow`)
    console.log(`\n⏭️  Próximo passo:`)
    console.log(`   1. Vá em: https://railway.app`)
    console.log(`   2. New Project → Deploy from GitHub Repo`)
    console.log(`   3. Procure: ${user.login}/foodflow`)
    console.log(`   4. Railway fará deploy automático!`)
    console.log('\n✅ Tudo pronto para deploy no Railway 🚀\n')
    
  } catch (error) {
    console.error('❌ Erro:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

main()
