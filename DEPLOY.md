# Guia de Deploy - Fred App

## 📋 Pré-requisitos na VPS

### 1. Instalar Docker e Docker Compose
```bash
# Atualizar pacotes
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Adicionar seu usuário ao grupo docker (evita usar sudo)
sudo usermod -aG docker $USER
newgrp docker

# Instalar Docker Compose
sudo apt install docker-compose -y

# Verificar instalação
docker --version
docker-compose --version
```

### 2. Instalar ferramentas adicionais
```bash
sudo apt install git nginx certbot -y
```

## 🚀 Deploy da Aplicação

### 1. Clonar o repositório na VPS
```bash
cd /home/$USER
git clone https://github.com/cevieiradev98/fred_app.git
cd fred_app
```

### 2. Configurar variáveis de ambiente
```bash
# Criar arquivo .env na raiz do projeto
nano .env
```

Adicione as seguintes variáveis:
```env
# Backend
SECRET_KEY=sua-chave-secreta-muito-segura-aqui
DATABASE_URL=sqlite:///./fred_app.db

# Frontend
NEXT_PUBLIC_API_URL=http://seu-dominio.com/api
# ou para IP: NEXT_PUBLIC_API_URL=http://seu-ip/api
```

### 3. Build e iniciar containers
```bash
# Build das imagens (primeira vez)
docker-compose build

# Iniciar todos os serviços
docker-compose up -d

# Verificar status dos containers
docker-compose ps

# Ver logs
docker-compose logs -f
```

### 4. Solução de problemas comuns no build

Se você encontrar um erro como "Module not found: Can't resolve 'lib/utils'" durante o build do frontend, siga estas etapas:

```bash
# 1. Verifique se os arquivos existem localmente
ls -la fred_app_frontend/lib/
ls -la fred_app_frontend/lib/utils.ts

# 2. Atualize o repositório para garantir todos os arquivos
git pull origin main

# 3. Tente build com mais memória (se disponível)
docker-compose build --memory=4g

# 4. Se ainda houver problemas, faça build individual do backend primeiro
docker-compose build backend
docker-compose build frontend

# 5. Verifique os arquivos copiados no build
docker run --rm -it --entrypoint ls $(docker images -q -f reference='*fred_app_frontend*') /app/lib/

# 6. Se o build continuar falhando, verifique o log detalhado
docker-compose build frontend --no-cache --progress=plain

# 7. Problema específico com caminhos absolutos no Next.js
# Se encontrar erro como "Can't resolve ''lib/utils''" (com aspas duplas extras):
# Isso pode ser um problema de resolução de caminhos no ambiente de build do Docker
# Verifique que o arquivo lib/utils.ts existe e tem as importações corretas
cat fred_app_frontend/lib/utils.ts
```

### 5. Testar a aplicação
```bash
# Backend (deve retornar JSON)
curl http://localhost:8000/docs

# Frontend (deve retornar HTML)
curl http://localhost:3000

# Nginx (proxy reverso)
curl http://localhost
```

## 🔒 Configurar SSL com Let's Encrypt

### 1. Atualizar nginx.conf com seu domínio
```bash
nano nginx.conf
```

Substitua `your-domain.com` pelo seu domínio real na seção comentada do HTTPS.

### 2. Obter certificado SSL
```bash
# Criar diretórios para certificados
mkdir -p certbot/conf certbot/www

# Obter certificado (substitua seu-email e seu-dominio.com)
docker-compose run --rm certbot certonly --webroot \
  --webroot-path=/var/www/certbot \
  --email seu-email@example.com \
  --agree-tos \
  --no-eff-email \
  -d seu-dominio.com -d www.seu-dominio.com

# Verificar se certificado foi criado
ls -la certbot/conf/live/seu-dominio.com/
```

### 3. Ativar HTTPS no nginx
```bash
# Editar nginx.conf
nano nginx.conf

# Descomentar a seção HTTPS (server block na porta 443)
# Comentar a seção temporária HTTP (location /api/ e location /)
# Descomentar o redirect HTTP -> HTTPS
```

### 4. Recarregar nginx
```bash
docker-compose restart nginx
```

## 📊 Comandos Úteis

### Gerenciar containers
```bash
# Parar todos os serviços
docker-compose down

# Parar e remover volumes (cuidado: apaga dados)
docker-compose down -v

# Reiniciar um serviço específico
docker-compose restart backend
docker-compose restart frontend

# Ver logs de um serviço específico
docker-compose logs -f backend
docker-compose logs -f frontend

# Executar comando dentro do container
docker-compose exec backend bash
docker-compose exec frontend sh
```

### Atualizar aplicação
```bash
# Puxar novas mudanças do git
git pull

# Rebuild e reiniciar
docker-compose down
docker-compose build
docker-compose up -d
```

### Backup do banco de dados
```bash
# Criar backup
docker-compose exec backend cp /app/fred_app.db /app/data/backup-$(date +%Y%m%d-%H%M%S).db

# Copiar backup para host
docker cp fred_app_backend:/app/data/ ./backups/
```

## 🔥 Firewall (UFW)

```bash
# Instalar UFW
sudo apt install ufw -y

# Configurar regras básicas
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Permitir SSH (IMPORTANTE: fazer antes de habilitar)
sudo ufw allow ssh
sudo ufw allow 22/tcp

# Permitir HTTP e HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Habilitar firewall
sudo ufw enable

# Verificar status
sudo ufw status verbose
```

## 🔍 Monitoramento

### Ver uso de recursos
```bash
# CPU e memória dos containers
docker stats

# Espaço em disco
df -h
du -sh /var/lib/docker
```

### Logs de sistema
```bash
# Logs do nginx
docker-compose logs nginx

# Logs do backend
docker-compose logs backend

# Logs do frontend
docker-compose logs frontend
```

## ⚠️ Troubleshooting

### Container não inicia
```bash
# Ver logs detalhados
docker-compose logs backend
docker-compose logs frontend

# Reconstruir do zero
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Erro de porta já em uso
```bash
# Ver o que está usando a porta 80/8000/3000
sudo lsof -i :80
sudo lsof -i :800
sudo lsof -i :3000

# Parar processo (se necessário)
sudo kill -9 <PID>
```

### SSL não funciona
```bash
# Verificar logs do certbot
docker-compose logs certbot

# Testar renovação manual
docker-compose run --rm certbot renew --dry-run

# Verificar configuração nginx
docker-compose exec nginx nginx -t
```

### Frontend não conecta no backend
```bash
# 1. Verificar variável de ambiente
docker-compose exec frontend env | grep NEXT_PUBLIC_API_URL

# 2. Verificar se backend responde
curl http://backend:8000/docs

# 3. Verificar nginx proxy
docker-compose exec nginx cat /etc/nginx/nginx.conf
```

## 📈 Performance e Otimização

### 1. Limpar recursos não utilizados
```bash
# Remover imagens não utilizadas
docker image prune -a

# Remover volumes não utilizados
docker volume prune

# Limpar tudo (cuidado!)
docker system prune -a --volumes
```

### 2. Logs rotativos
```bash
# Editar docker-compose.yml e adicionar para cada serviço:
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

## 🔐 Segurança Adicional

### 1. Gerar SECRET_KEY segura
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 2. Atualizar sistema regularmente
```bash
sudo apt update && sudo apt upgrade -y
docker-compose pull
docker-compose up -d
```

### 3. Backup automático (crontab)
```bash
# Editar crontab
crontab -e

# Adicionar linha para backup diário às 2h
0 2 * * cd /home/$USER/fred_app && docker-compose exec -T backend cp /app/fred_app.db /app/data/backup-$(date +\%Y\%m\%d).db
```

## 📞 Suporte

Para problemas ou dúvidas:
1. Verificar logs: `docker-compose logs -f`
2. Verificar status: `docker-compose ps`
3. Reiniciar serviços: `docker-compose restart`

## 🎯 Checklist de Deploy

- [ ] VPS configurada com Docker e Docker Compose
- [ ] Repositório clonado
- [ ] Arquivo `.env` configurado
- [ ] Containers buildados e rodando
- [ ] Firewall (UFW) configurado
- [ ] Domínio apontando para VPS (se usar domínio)
- [ ] Certificado SSL configurado (Let's Encrypt)
- [ ] HTTPS habilitado no nginx
- [ ] Backup configurado
- [ ] Monitoramento ativo

## 🌐 Estrutura Final

```
VPS (seu-dominio.com)
├── Nginx (porta 80/443) → Proxy Reverso
│   ├── /api/* → Backend (FastAPI)
│   └── /* → Frontend (Next.js)
├── Backend Container (porta 800)
├── Frontend Container (porta 300)
└── Certbot (renovação SSL automática)
