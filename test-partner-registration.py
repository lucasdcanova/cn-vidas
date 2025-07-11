#!/usr/bin/env python3

"""
Script de teste detalhado para verificar o fluxo de registro de parceiros
Uso: python3 test-partner-registration.py [URL_BASE]
"""

import requests
import json
import time
import sys
from datetime import datetime

# Desabilitar avisos de SSL para desenvolvimento
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Configurações
BASE_URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3000"
TIMESTAMP = int(time.time())

# Dados do parceiro teste
test_partner = {
    "email": f"partner.test.{TIMESTAMP}@example.com",
    "username": "e48780455000101",
    "password": "senha123",
    "fullName": f"Empresa Teste {TIMESTAMP}",
    "role": "partner",
    "cnpj": "48.780.455/0001-01",
    "acceptTerms": True,
    "acceptPrivacy": True,
    "acceptPartnerContract": True
}

# Cores ANSI
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def print_header(text):
    print(f"\n{Colors.HEADER}{Colors.BOLD}{text}{Colors.ENDC}")

def print_success(text):
    print(f"{Colors.OKGREEN}✅ {text}{Colors.ENDC}")

def print_error(text):
    print(f"{Colors.FAIL}❌ {text}{Colors.ENDC}")

def print_warning(text):
    print(f"{Colors.WARNING}⚠️  {text}{Colors.ENDC}")

def print_info(text):
    print(f"{Colors.OKBLUE}ℹ️  {text}{Colors.ENDC}")

def print_json(data):
    print(json.dumps(data, indent=2, ensure_ascii=False))

def test_partner_registration():
    # Criar sessão para manter cookies
    session = requests.Session()
    session.verify = False  # Para desenvolvimento com certificados auto-assinados
    
    print_header("🧪 TESTE DE REGISTRO DE PARCEIRO")
    print_info(f"URL Base: {BASE_URL}")
    print_info(f"Email teste: {test_partner['email']}")
    print_info(f"CNPJ: {test_partner['cnpj']}")
    
    results = {
        "registro": False,
        "autenticacao": False,
        "acesso_onboarding": False,
        "api_parceiro": False
    }
    
    try:
        # 1. REGISTRAR PARCEIRO
        print_header("1️⃣  REGISTRO DO PARCEIRO")
        
        register_response = session.post(
            f"{BASE_URL}/api/register",
            json=test_partner,
            headers={"Content-Type": "application/json"}
        )
        
        if register_response.status_code in [200, 201]:
            print_success("Parceiro registrado com sucesso!")
            user_data = register_response.json()
            print_info(f"ID: {user_data.get('id', 'N/A')}")
            print_info(f"Email: {user_data.get('email', 'N/A')}")
            print_info(f"Role: {user_data.get('role', 'N/A')}")
            
            # Verificar cookies
            if 'auth_token' in session.cookies:
                print_success("Cookie de autenticação recebido")
            else:
                print_warning("Cookie de autenticação não encontrado")
            
            results["registro"] = True
        else:
            print_error(f"Falha no registro: HTTP {register_response.status_code}")
            print_json(register_response.json())
            return results
        
        # Pequena pausa para garantir que os dados sejam processados
        time.sleep(1)
        
        # 2. VERIFICAR AUTENTICAÇÃO
        print_header("2️⃣  VERIFICAÇÃO DE AUTENTICAÇÃO")
        
        user_response = session.get(f"{BASE_URL}/api/user")
        
        if user_response.status_code == 200:
            print_success("Usuário autenticado automaticamente!")
            auth_data = user_response.json()
            print_info(f"ID: {auth_data.get('id', 'N/A')}")
            print_info(f"Email: {auth_data.get('email', 'N/A')}")
            print_info(f"Role: {auth_data.get('role', 'N/A')}")
            results["autenticacao"] = True
        else:
            print_error(f"Falha na autenticação: HTTP {user_response.status_code}")
            if user_response.text:
                print(user_response.text)
        
        # 3. VERIFICAR ACESSO AO ONBOARDING
        print_header("3️⃣  ACESSO AO PARTNER-ONBOARDING")
        
        # Tentar acessar a página de onboarding
        onboarding_response = session.get(
            f"{BASE_URL}/partner-onboarding",
            allow_redirects=True
        )
        
        if onboarding_response.status_code == 200:
            # Verificar se não foi redirecionado para login
            final_url = onboarding_response.url
            page_content = onboarding_response.text.lower()
            
            if 'auth' in final_url or 'login' in final_url:
                print_error(f"Redirecionado para login! URL final: {final_url}")
            elif 'login' in page_content and 'password' in page_content:
                print_warning("Página contém formulário de login - possível redirecionamento")
            else:
                print_success("Acesso ao partner-onboarding permitido!")
                print_info(f"URL final: {final_url}")
                results["acesso_onboarding"] = True
        else:
            print_error(f"Erro ao acessar onboarding: HTTP {onboarding_response.status_code}")
        
        # 4. VERIFICAR API DO PARCEIRO
        print_header("4️⃣  API DO PARCEIRO")
        
        partner_response = session.get(f"{BASE_URL}/api/partners/me")
        
        if partner_response.status_code == 200:
            print_success("Dados do parceiro recuperados!")
            partner_data = partner_response.json()
            print_info(f"Business Name: {partner_data.get('businessName', 'Não definido')}")
            print_info(f"CNPJ: {partner_data.get('cnpj', 'Não definido')}")
            print_info(f"Onboarding Completed: {partner_data.get('onboardingCompleted', False)}")
            results["api_parceiro"] = True
        else:
            print_error(f"Erro ao recuperar dados: HTTP {partner_response.status_code}")
            if partner_response.text:
                print(partner_response.text)
        
        # RESUMO FINAL
        print_header("📊 RESUMO DO TESTE")
        
        total_testes = len(results)
        testes_passados = sum(results.values())
        
        print(f"\nTestes executados: {total_testes}")
        print(f"Testes passados: {testes_passados}")
        print(f"Taxa de sucesso: {(testes_passados/total_testes)*100:.0f}%\n")
        
        for teste, passou in results.items():
            status = "✅ PASSOU" if passou else "❌ FALHOU"
            print(f"{teste.replace('_', ' ').title()}: {status}")
        
        if all(results.values()):
            print_success("\n🎉 TODOS OS TESTES PASSARAM!")
            print_info("O fluxo de registro de parceiro está funcionando corretamente.")
        else:
            print_error("\n⚠️  ALGUNS TESTES FALHARAM")
            print_info("Verifique os logs acima para mais detalhes.")
        
    except Exception as e:
        print_error(f"ERRO DURANTE O TESTE: {str(e)}")
        import traceback
        traceback.print_exc()
    
    return results

if __name__ == "__main__":
    test_partner_registration()