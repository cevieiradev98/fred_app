# Configuração do Supabase

Este guia explica como configurar o backend para usar o Supabase ao invés do PostgreSQL local.

## 1. Criar Projeto no Supabase

1. Acesse [https://app.supabase.com](https://app.supabase.com)
2. Crie uma conta ou faça login
3. Clique em "New Project"
4. Escolha sua organização
5. Configure o projeto:
   - **Name**: fred-app (ou o nome que preferir)
   - **Database Password**: Escolha uma senha forte (você vai precisar dela!)
   - **Region**: South America (São Paulo) - para menor latência
   - **Pricing Plan**: Free (ou pago se preferir)

## 2. Obter Credenciais do Supabase

### 2.1 API Keys

1. No dashboard do Supabase, vá em **Settings** → **API**
2. Copie as seguintes informações:
   - **Project URL** (ex: `https://xxxxx.supabase.co`)
   - **anon public** key (chave pública)
   - **service_role** key (chave de serviço - mantenha em segredo!)

### 2.2 Database Connection String

1. No dashboard do Supabase, vá em **Settings** → **Database**
2. Na seção **Connection String**, escolha a aba **Connection Pooling** (não URI direto!)
3. Selecione o modo **Transaction**
4. Copie a connection string no formato pooler:
   ```
   postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
   ```
5. **IMPORTANTE**: Substitua `[YOUR-PASSWORD]` pela senha do banco que você configurou na criação do projeto

### 2.3 Converter para SQLAlchemy

O SQLAlchemy precisa de um formato específico. Converta sua connection string:

**De (formato pooler do Supabase):**
```
postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
```

**Para (formato SQLAlchemy):**
```
postgresql+psycopg://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
```

Note a mudança: `postgresql://` → `postgresql+psycopg://`

**Por que usar o Connection Pooler (porta 6543)?**
- ✅ Evita problemas com IPv6 em containers Docker
- ✅ Melhor performance e gerenciamento de conexões
- ✅ Suporta mais conexões simultâneas
- ✅ Recomendado para ambientes de produção

## 3. Configurar Variáveis de Ambiente

### 3.1 Criar arquivo .env

Crie um arquivo `.env` na raiz do projeto (se ainda não existir):

```bash
cp .env.example .env
```

### 3.2 Editar o arquivo .env

Edite o arquivo `.env` com suas credenciais:

```env
# Backend Configuration
SECRET_KEY=your-secret-key-here-change-this

# Supabase Configuration
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Database Configuration
DATABASE_URL=postgresql+psycopg://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres

# Frontend Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Substitua:**
- `xxxxx` pelo ID do seu projeto Supabase
- `YOUR_PASSWORD` pela senha do banco de dados
- As keys pelos valores reais copiados do dashboard

## 4. Criar Tabelas no Supabase

O SQLAlchemy vai criar as tabelas automaticamente na primeira execução, mas você pode fazer isso manualmente:

### 4.1 Via Supabase Dashboard (SQL Editor)

1. No dashboard do Supabase, vá em **SQL Editor**
2. Execute os comandos SQL para criar suas tabelas (se necessário)

### 4.2 Via Alembic (Recomendado para migrations)

Se você estiver usando Alembic para migrations:

```bash
# Gerar migration
alembic revision --autogenerate -m "Initial migration"

# Aplicar migration
alembic upgrade head
```

## 5. Testar a Conexão

### 5.1 Localmente (sem Docker)

```bash
cd fred_app_backend
pip install -r requirements.txt
python run.py
```

Acesse [http://localhost:3001/docs](http://localhost:3001/docs) para ver a documentação da API.

### 5.2 Com Docker

```bash
# Rebuild da imagem (importante após mudanças no requirements.txt)
docker compose build backend

# Subir os serviços
docker compose up -d

# Ver logs
docker compose logs -f backend
```

Você deve ver nos logs:
```
[Database] Connecting to Supabase -> database_url=***configured***
```

## 6. Verificar Dados no Supabase

1. No dashboard do Supabase, vá em **Table Editor**
2. Você deve ver as tabelas criadas:
   - `pets`
   - `routine_templates`
   - `routine_items`
   - `glucose_readings`
   - `mood_entries`

## 7. Recursos Adicionais do Supabase

Além do banco de dados PostgreSQL, o Supabase oferece:

### 7.1 Authentication

O cliente Supabase já está configurado em `app/supabase.py`. Para usar autenticação:

```python
from app.supabase import get_supabase_client

client = get_supabase_client()
if client:
    # Criar usuário
    user = client.auth.sign_up({
        "email": "user@example.com",
        "password": "secure_password"
    })
```

### 7.2 Storage

Para armazenar arquivos (fotos de pets, etc):

```python
from app.supabase import get_supabase_client

client = get_supabase_client()
if client:
    # Upload de arquivo
    client.storage.from_("pet-photos").upload(
        "pet_1.jpg",
        file_data
    )
```

### 7.3 Realtime

Para updates em tempo real:

```python
from app.supabase import get_supabase_client

client = get_supabase_client()
if client:
    # Subscribe to changes
    client.table("pets").on("*", lambda payload: print(payload)).subscribe()
```

## 8. Row Level Security (RLS)

O Supabase usa RLS para segurança. Por padrão, as tabelas criadas via SQLAlchemy **não têm RLS habilitado**.

### 8.1 Habilitar RLS (Opcional, mas Recomendado)

No SQL Editor do Supabase:

```sql
-- Habilitar RLS para tabela pets
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir todas as operações (exemplo)
CREATE POLICY "Enable all operations for authenticated users"
ON pets
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Repetir para outras tabelas conforme necessário
```

## 9. Desenvolvimento Local vs Produção

### Desenvolvimento Local (sem Supabase)

Se quiser desenvolver localmente sem Supabase:

1. No `docker-compose.yml`, descomente o serviço `postgres`
2. No `docker-compose.yml`, descomente o `depends_on` do backend
3. Configure as variáveis `DB_*` no `.env`
4. Remova ou deixe vazio `SUPABASE_URL` e `DATABASE_URL`

### Produção (com Supabase)

Mantenha as configurações atuais com as credenciais do Supabase.

## 10. Troubleshooting

### Erro: "DATABASE_URL is not configured"

- Verifique se o arquivo `.env` está na raiz do projeto
- Verifique se `DATABASE_URL` está definida no `.env`
- Certifique-se de usar o formato correto: `postgresql+psycopg://...`

### Erro: "connection to server failed"

- Verifique se a senha do banco está correta
- Verifique se o ID do projeto (ref) está correto na URL
- Verifique sua conexão com a internet
- Verifique se o projeto Supabase não está pausado (free tier pausa após 7 dias de inatividade)

### Erro: "SSL connection required"

O Supabase requer SSL. Adicione `?sslmode=require` no final da `DATABASE_URL`:

```
DATABASE_URL=postgresql+psycopg://postgres:pass@db.xxxxx.supabase.co:5432/postgres?sslmode=require
```

### Tabelas não aparecem no Supabase

- Certifique-se de que a aplicação rodou pelo menos uma vez
- Verifique os logs do backend para erros
- Tente criar as tabelas manualmente via SQL Editor

## 11. Backup e Migração

### Backup do Supabase

O Supabase faz backups automáticos, mas você pode fazer manual:

1. No dashboard: **Database** → **Backups**
2. Clique em "Create Backup"

### Migrar dados do Postgres local para Supabase

Se você tinha dados no Postgres local:

```bash
# Dump do banco local
pg_dump -h localhost -U fred_app -d fred_app > backup.sql

# Importar no Supabase via psql
psql "postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres" < backup.sql
```

## Suporte

Para mais informações:
- [Documentação do Supabase](https://supabase.com/docs)
- [Supabase Python Client](https://supabase.com/docs/reference/python/introduction)
- [SQLAlchemy](https://docs.sqlalchemy.org/)
