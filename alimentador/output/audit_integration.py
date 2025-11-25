#!/usr/bin/env python3
"""
🔍 N8N + Supabase Integration Audit Script
Verifica a integração entre N8N, Supabase e FoodFlow
"""

import os
import json
import sys
from typing import Dict, List, Optional
import urllib.request
import urllib.error

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'

def print_header(text: str):
    print(f"\n{Colors.BLUE}{'='*60}{Colors.RESET}")
    print(f"{Colors.BLUE}{text}{Colors.RESET}")
    print(f"{Colors.BLUE}{'='*60}{Colors.RESET}\n")

def print_success(text: str):
    print(f"{Colors.GREEN}✅ {text}{Colors.RESET}")

def print_error(text: str):
    print(f"{Colors.RED}❌ {text}{Colors.RESET}")

def print_warning(text: str):
    print(f"{Colors.YELLOW}⚠️  {text}{Colors.RESET}")

def print_info(text: str):
    print(f"{Colors.BLUE}ℹ️  {text}{Colors.RESET}")

class N8NAudit:
    def __init__(self, host: str, api_key: str):
        self.host = host
        self.api_key = api_key
        self.base_url = f"https://{host}/api/v1"

    def _make_request(self, method: str, endpoint: str, data: Optional[Dict] = None) -> Optional[Dict]:
        """Make HTTP request to N8N API"""
        try:
            url = f"{self.base_url}{endpoint}"
            headers = {
                'X-N8N-API-KEY': self.api_key,
                'Content-Type': 'application/json'
            }
            
            if data:
                data = json.dumps(data).encode('utf-8')
            
            req = urllib.request.Request(url, data=data, headers=headers, method=method)
            
            with urllib.request.urlopen(req, timeout=10) as response:
                return json.loads(response.read().decode('utf-8'))
        except urllib.error.HTTPError as e:
            print_error(f"HTTP Error: {e.code}")
            return None
        except Exception as e:
            print_error(f"Request failed: {str(e)}")
            return None

    def test_connection(self) -> bool:
        """Test N8N API connectivity"""
        print_info(f"Testing N8N connection to {self.host}...")
        
        result = self._make_request('GET', '/health')
        if result:
            print_success("N8N API is accessible")
            return True
        else:
            print_error("Cannot connect to N8N API")
            return False

    def list_workflows(self) -> List[Dict]:
        """List all N8N workflows"""
        print_info("Fetching workflows from N8N...")
        
        result = self._make_request('GET', '/workflows')
        if result and 'data' in result:
            workflows = result['data']
            print_success(f"Found {len(workflows)} workflows")
            return workflows
        else:
            print_error("Failed to fetch workflows")
            return []

    def audit(self):
        """Run full N8N audit"""
        print_header("🤖 N8N AUDIT")
        
        if not self.test_connection():
            return
        
        workflows = self.list_workflows()
        
        # Check for critical workflows
        critical_workflows = ['FoodFlow WhatsApp Agent', 'agente de atendimento']
        found_workflows = {w['name'] for w in workflows}
        
        print_info("Checking for critical workflows...")
        for wf_name in critical_workflows:
            if wf_name in found_workflows:
                print_success(f"Found: {wf_name}")
            else:
                print_warning(f"Missing: {wf_name}")
        
        # List workflows with WhatsApp
        print_info("\nWorkflows related to WhatsApp:")
        whatsapp_workflows = [w for w in workflows if 'whatsapp' in w['name'].lower()]
        
        if whatsapp_workflows:
            for wf in whatsapp_workflows:
                status = "🟢 Active" if wf.get('active') else "🔴 Inactive"
                print(f"  • {wf['name']} - {status}")
        else:
            print_warning("No WhatsApp workflows found")
        
        return workflows

class SupabaseAudit:
    def __init__(self, url: str, anon_key: str):
        self.url = url.rstrip('/')
        self.anon_key = anon_key

    def _make_request(self, method: str, path: str, data: Optional[Dict] = None) -> Optional[Dict]:
        """Make HTTP request to Supabase API"""
        try:
            url = f"{self.url}/rest/v1{path}"
            headers = {
                'apikey': self.anon_key,
                'Authorization': f'Bearer {self.anon_key}',
                'Content-Type': 'application/json'
            }
            
            if data:
                data = json.dumps(data).encode('utf-8')
            
            req = urllib.request.Request(url, data=data, headers=headers, method=method)
            
            with urllib.request.urlopen(req, timeout=10) as response:
                return json.loads(response.read().decode('utf-8'))
        except urllib.error.HTTPError as e:
            if e.code == 301:
                print_warning("Supabase redirected (SSL/Host issue)")
            else:
                print_error(f"HTTP Error: {e.code}")
            return None
        except Exception as e:
            print_error(f"Request failed: {str(e)}")
            return None

    def test_connection(self) -> bool:
        """Test Supabase connectivity"""
        print_info(f"Testing Supabase connection to {self.url}...")
        
        # Try a simple query
        result = self._make_request('GET', '/whatsapp_sessions?limit=1')
        if result is not None:
            print_success("Supabase API is accessible")
            return True
        else:
            print_error("Cannot connect to Supabase API")
            return False

    def check_tables(self) -> Dict[str, bool]:
        """Check if required tables exist"""
        print_info("Checking Supabase tables...")
        
        tables = {
            'whatsapp_sessions': False,
            'whatsapp_messages': False,
            'whatsapp_orders': False
        }
        
        for table_name in tables.keys():
            result = self._make_request('GET', f'/{table_name}?limit=1')
            if result is not None:
                tables[table_name] = True
                count = len(result) if isinstance(result, list) else 0
                print_success(f"Table '{table_name}' exists ({count} records)")
            else:
                print_error(f"Table '{table_name}' not found or error")
        
        return tables

    def get_table_schema(self, table_name: str) -> Optional[List[Dict]]:
        """Get table schema information"""
        print_info(f"Getting schema for {table_name}...")
        
        # This endpoint might not work directly, but we can try
        try:
            result = self._make_request('GET', 
                f'/information_schema.columns?table_name=eq.{table_name}&table_schema=eq.public')
            if result:
                return result
        except:
            pass
        
        return None

    def audit(self):
        """Run full Supabase audit"""
        print_header("🗄️  SUPABASE AUDIT")
        
        if not self.test_connection():
            return
        
        tables = self.check_tables()
        
        # Summary
        print_info("\nTable Summary:")
        all_exist = all(tables.values())
        if all_exist:
            print_success("All required tables exist ✅")
        else:
            missing = [t for t, exists in tables.items() if not exists]
            print_error(f"Missing tables: {', '.join(missing)}")
        
        return tables

def main():
    """Main audit function"""
    print(f"\n{Colors.BLUE}🔍 N8N + Supabase Integration Audit{Colors.RESET}")
    print(f"{Colors.BLUE}Generated: {__import__('datetime').datetime.now().isoformat()}{Colors.RESET}")
    
    # Get credentials from environment
    n8n_host = os.getenv('N8N_HOST', 'n8n-docker-production-6703.up.railway.app')
    n8n_api_key = os.getenv('N8N_API_KEY')
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_ANON_KEY')
    
    # Check credentials
    print("\n📋 Checking Credentials:")
    
    if n8n_api_key:
        print_success("N8N_API_KEY found")
    else:
        print_error("N8N_API_KEY not set")
    
    if supabase_url and supabase_key:
        print_success("Supabase credentials found")
    else:
        print_error("Supabase credentials not set")
    
    # Run audits
    if n8n_api_key:
        n8n = N8NAudit(n8n_host, n8n_api_key)
        n8n.audit()
    
    if supabase_url and supabase_key:
        supabase = SupabaseAudit(supabase_url, supabase_key)
        supabase.audit()
    
    # Final recommendations
    print_header("📋 RECOMENDAÇÕES")
    print("""
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
    """)

if __name__ == '__main__':
    main()
