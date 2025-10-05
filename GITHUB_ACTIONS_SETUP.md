# GitHub Actions - Configuração de Deploy Automático

Este documento explica como configurar o deploy automático usando GitHub Actions.

## 🚀 Como Funciona

O workflow `.github/workflows/deploy.yml` automatiza o deploy sempre que você fizer push para a branch `master`:

1. Conecta ao servidor via SSH
2. Faz pull das últimas mudanças
3. Rebuild dos containers Docker
4. Restart da aplicação
5. Limpeza de imagens antigas

## 🔑 Configurar Secrets no GitHub

Você precisa adicionar as seguintes secrets no seu repositório GitHub:

### Passo a Passo:

1. Vá até o repositório no GitHub
2. Clique em **Settings** (Configurações)
3. No menu lateral, clique em **Secrets and variables** → **Actions**
4. Clique em **New repository secret**
5. Adicione os seguintes secrets:

### Secrets Necessários:

| Secret Name | Descrição | Exemplo |
|------------|-----------|---------|
| `SERVER_HOST` | IP ou domínio do servidor | `45.39.210.36` |
| `SERVER_USER` | Usuário SSH do servidor | `root` ou `ubuntu` |
| `SSH_PRIVATE_KEY` | Chave SSH privada | (veja abaixo) |
| `SERVER_PORT` | Porta SSH (opcional) | `22` (padrão) |

## 🔐 Como Obter a Chave SSH

### Opção 1: Usar chave SSH existente

Se você já tem uma chave SSH que usa para conectar ao servidor:

```bash
# No seu computador local
cat ~/.ssh/id_rsa
```

Copie TODO o conteúdo (incluindo `-----BEGIN OPENSSH PRIVATE KEY-----` e `-----END OPENSSH PRIVATE KEY-----`) e cole como valor do secret `SSH_PRIVATE_KEY`.

### Opção 2: Criar uma nova chave SSH

```bash
# 1. Gerar nova chave SSH (no seu computador local)
ssh-keygen -t rsa -b 4096 -C "github-actions" -f ~/.ssh/github_actions_key

# 2. Copiar a chave PÚBLICA para o servidor
ssh-copy-id -i ~/.ssh/github_actions_key.pub seu-usuario@45.39.210.36

# Ou manualmente:
cat ~/.ssh/github_actions_key.pub
# Copie o conteúdo e adicione em ~/.ssh/authorized_keys no servidor

# 3. Copiar a chave PRIVADA para usar no GitHub
cat ~/.ssh/github_actions_key
# Cole este conteúdo no secret SSH_PRIVATE_KEY do GitHub
```

## 📋 Configuração no Servidor

### 1. Certifique-se de que o Git está configurado no servidor:

```bash
# No servidor
cd ~/fred_app

# Configurar git (se ainda não configurado)
git config --global user.email "you@example.com"
git config --global user.name "Your Name"

# Verificar se consegue fazer pull
git pull origin master
```

### 2. Verifique se o Docker está instalado:

```bash
docker --version
docker-compose --version
```

## 🎯 Como Usar

Depois de configurar os secrets:

1. **Faça suas alterações localmente**
   ```bash
   git add .
   git commit -m "Suas alterações"
   git push origin master
   ```

2. **O GitHub Actions executa automaticamente**
   - Vá em **Actions** no repositório GitHub
   - Veja o progresso do deploy em tempo real

3. **Deploy concluído!**
   - A aplicação será atualizada automaticamente no servidor

## 📊 Monitorar o Deploy

1. Vá até o repositório no GitHub
2. Clique na aba **Actions**
3. Veja o histórico de deploys
4. Clique em qualquer deploy para ver os logs detalhados

## 🔧 Personalizar o Workflow

Você pode editar `.github/workflows/deploy.yml` para:

- Adicionar testes antes do deploy
- Fazer deploy apenas de tags/releases
- Adicionar notificações (Slack, Discord, etc.)
- Criar backup antes do deploy

### Exemplo: Deploy apenas em tags

```yaml
on:
  push:
    tags:
      - 'v*'
```

### Exemplo: Adicionar testes

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run tests
        run: |
          cd fred_app_backend
          pip install -r requirements.txt
          pytest
  
  deploy:
    needs: test
    runs-on: ubuntu-latest
    # ... resto do deploy
```

## ⚠️ Troubleshooting

### Erro: Permission denied

- Verifique se a chave SSH está correta
- Certifique-se de que a chave pública está em `~/.ssh/authorized_keys` no servidor

### Erro: Command not found (docker-compose)

No servidor, verifique o caminho do docker-compose:
```bash
which docker-compose
```

Se estiver em outro local, atualize o workflow.

### Erro: Directory not found

Ajuste o caminho no workflow se seu projeto não está em `~/fred_app`:
```yaml
cd /caminho/correto/do/projeto || exit 1
```

## 🔒 Segurança

- ✅ Nunca commit suas chaves privadas no repositório
- ✅ Use secrets do GitHub para informações sensíveis
- ✅ Mantenha as chaves SSH seguras e rotacione periodicamente
- ✅ Use chaves SSH específicas para CI/CD (não reutilize sua chave pessoal)

## 📝 Backup Antes do Deploy (Opcional)

Adicione antes do rebuild no workflow:

```yaml
# Criar backup do banco de dados
cp ./data/fred_app.db ./data/backups/fred_app_$(date +%Y%m%d_%H%M%S).db
