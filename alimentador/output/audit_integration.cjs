#!/usr/bin/env node
/**
 * 🔍 N8N + Supabase Integration Audit Script
 * Verifica a integração entre N8N, Supabase e FoodFlow
 */

const https = require('https');

const Colors = {
  GREEN: '\x1b[92m',
  RED: '\x1b[91m',
  YELLOW: '\x1b[93m',
  BLUE: '\x1b[94m',
  RESET: '\x1b[0m'
};

function printHeader(text) {
  console.log(`\n${Colors.BLUE}${'='.repeat(60)}${Colors.RESET}`);
  console.log(`${Colors.BLUE}${text}${Colors.RESET}`);
  console.log(`${Colors.BLUE}${'='.repeat(60)}${Colors.RESET}\n`);
}

function printSuccess(text) {
  console.log(`${Colors.GREEN}✅ ${text}${Colors.RESET}`);
}

function printError(text) {
  console.log(`${Colors.RED}❌ ${text}${Colors.RESET}`);
}

function printWarning(text) {
  console.log(`${Colors.YELLOW}⚠️  ${text}${Colors.RESET}`);
}

function printInfo(text) {
  console.log(`${Colors.BLUE}ℹ️  ${text}${Colors.RESET}`);
}

class N8NAudit {
  constructor(host, apiKey) {
    this.host = host;
    this.apiKey = apiKey;
    this.baseUrl = `https://${host}/api/v1`;
  }

  makeRequest(method, endpoint) {
    return new Promise((resolve) => {
      const options = {
        hostname: this.host,
        path: `/api/v1${endpoint}`,
        method,
        headers: {
          'X-N8N-API-KEY': this.apiKey,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve(null);
          }
        });
      });

      req.on('error', () => resolve(null));
      req.on('timeout', () => resolve(null));
      req.end();
    });
  }

  async testConnection() {
    printInfo(`Testing N8N connection to ${this.host}...`);
    const result = await this.makeRequest('GET', '/health');
    if (result) {
      printSuccess('N8N API is accessible');
      return true;
    } else {
      printError('Cannot connect to N8N API');
      return false;
    }
  }

  async listWorkflows() {
    printInfo('Fetching workflows from N8N...');
    const result = await this.makeRequest('GET', '/workflows');
    if (result && result.data) {
      printSuccess(`Found ${result.data.length} workflows`);
      return result.data;
    } else {
      printError('Failed to fetch workflows');
      return [];
    }
  }

  async audit() {
    printHeader('🤖 N8N AUDIT');

    if (!await this.testConnection()) {
      return;
    }

    const workflows = await this.listWorkflows();

    const criticalWorkflows = ['FoodFlow WhatsApp Agent', 'agente de atendimento'];
    const foundWorkflows = new Set(workflows.map(w => w.name));

    printInfo('Checking for critical workflows...');
    for (const wfName of criticalWorkflows) {
      if (foundWorkflows.has(wfName)) {
        printSuccess(`Found: ${wfName}`);
      } else {
        printWarning(`Missing: ${wfName}`);
      }
    }

    printInfo('\nWorkflows related to WhatsApp:');
    const whatsappWorkflows = workflows.filter(w => 
      w.name.toLowerCase().includes('whatsapp')
    );

    if (whatsappWorkflows.length > 0) {
      for (const wf of whatsappWorkflows) {
        const status = wf.active ? '🟢 Active' : '🔴 Inactive';
        console.log(`  • ${wf.name} - ${status}`);
      }
    } else {
      printWarning('No WhatsApp workflows found');
    }

    return workflows;
  }
}

class SupabaseAudit {
  constructor(url, anonKey) {
    this.url = url.replace(/\/$/, '');
    this.anonKey = anonKey;
  }

  makeRequest(method, path) {
    return new Promise((resolve) => {
      const fullUrl = `${this.url}/rest/v1${path}`;
      const url = new URL(fullUrl);

      const options = {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method,
        headers: {
          'apikey': this.anonKey,
          'Authorization': `Bearer ${this.anonKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve(null);
          }
        });
      });

      req.on('error', () => resolve(null));
      req.on('timeout', () => resolve(null));
      req.end();
    });
  }

  async testConnection() {
    printInfo(`Testing Supabase connection to ${this.url}...`);
    const result = await this.makeRequest('GET', '/whatsapp_sessions?limit=1');
    if (result !== null) {
      printSuccess('Supabase API is accessible');
      return true;
    } else {
      printError('Cannot connect to Supabase API');
      return false;
    }
  }

  async checkTables() {
    printInfo('Checking Supabase tables...');

    const tables = {
      'whatsapp_sessions': false,
      'whatsapp_messages': false,
      'whatsapp_orders': false
    };

    for (const tableName of Object.keys(tables)) {
      const result = await this.makeRequest('GET', `/${tableName}?limit=1`);
      if (result !== null) {
        tables[tableName] = true;
        const count = Array.isArray(result) ? result.length : 0;
        printSuccess(`Table '${tableName}' exists (${count} records)`);
      } else {
        printError(`Table '${tableName}' not found or error`);
      }
    }

    return tables;
  }

  async audit() {
    printHeader('🗄️  SUPABASE AUDIT');

    if (!await this.testConnection()) {
      return;
    }

    const tables = await this.checkTables();

    printInfo('\nTable Summary:');
    const allExist = Object.values(tables).every(v => v);
    if (allExist) {
      printSuccess('All required tables exist ✅');
    } else {
      const missing = Object.entries(tables)
        .filter(([_, exists]) => !exists)
        .map(([name, _]) => name);
      printError(`Missing tables: ${missing.join(', ')}`);
    }

    return tables;
  }
}

async function main() {
  console.log(`\n${Colors.BLUE}🔍 N8N + Supabase Integration Audit${Colors.RESET}`);
  console.log(`${Colors.BLUE}Generated: ${new Date().toISOString()}${Colors.RESET}`);

  const n8nHost = process.env.N8N_HOST || 'n8n-docker-production-6703.up.railway.app';
  const n8nApiKey = process.env.N8N_API_KEY;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  console.log('\n📋 Checking Credentials:');

  if (n8nApiKey) {
    printSuccess('N8N_API_KEY found');
  } else {
    printError('N8N_API_KEY not set');
  }

  if (supabaseUrl && supabaseKey) {
    printSuccess('Supabase credentials found');
  } else {
    printError('Supabase credentials not set');
  }

  if (n8nApiKey) {
    const n8n = new N8NAudit(n8nHost, n8nApiKey);
    await n8n.audit();
  }

  if (supabaseUrl && supabaseKey) {
    const supabase = new SupabaseAudit(supabaseUrl, supabaseKey);
    await supabase.audit();
  }

  printHeader('📋 RECOMENDAÇÕES');
  console.log(`
1. ✅ CRÍTICO:
   - Execute SQL audit queries no Supabase SQL Editor
   - Verifique schema das tabelas
   - Corrija colunas faltantes

2. 🔧 IMPORTANTE:
   - Crie/atualize workflow "agente de atendimento" no N8N
   - Configure Supabase integration no N8N
   - Teste fluxo completo

3. 📊 MONITORAMENTO:
   - Ative logging de execuções N8N
   - Monitore taxa de sucesso/erro
   - Acompanhe performance

Documentação: /home/runner/workspace/alimentador/output/
    - ANALISE_N8N_SUPABASE.md
    - audit_supabase.sql
    - n8n_workflow_audit.md
  `);
}

main().catch(console.error);
