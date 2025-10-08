# Guia de Configuração do Domínio fred-app.telescoope.com.br

Este guia contém todos os passos necessários para configurar seu domínio personalizado.

## Pré-requisitos

- Servidor com IP público
- Acesso ao painel de controle do domínio telescoope.com.br
- Docker e Docker Compose instalados no servidor

## Passo 1: Configurar DNS

No painel de controle do domínio telescoope.com.br, adicione um registro A:

```
Tipo: A
Nome: fred-app
Valor: [IP_DO_SEU_SERVIDOR]
TTL: 3600 (ou deixe o padrão)
```

**Exemplo:**
- Se seu servidor tem IP `203.0.113.50`
- O registro ficará: `fred-app.telescoope.com.br` → `203.0.113.50`

⏱️ **Aguarde**: A propagação DNS pode levar de 5 minutos a 48 horas (geralmente 15-30 minutos).

### Verificar se o DNS está propagado:

```bash
# No seu computador local
nslookup fred-app.telescoope.com.br

# Ou
dig fred-app.telescoope.com.br +short
```

Se retornar o IP do seu servidor, o DNS está configurado corretamente.

## Passo 2: Atualizar nginx.conf

No arquivo `nginx.conf`, atualize o `server_name` na linha 45:

```nginx
server {
    listen 80;
    server_name fred-app.telescoope.com.br;  # ← Altere esta linha
    ...
}
```

## Passo 3: Parar os containers atuais

```bash
cd /home/vieira/dev/fred_app
docker-compose down
```

## Passo 4: Obter certificado SSL (Let's Encrypt)

### 4.1. Parar todos os containers primeiro

```bash
cd /home/vieira/dev/fred_app
sudo docker compose down
```

### 4.2. **IMPORTANTE**: Verificar o nginx.conf no servidor

Antes de iniciar o nginx, certifique-se de que o arquivo `nginx.conf` está correto:

```bash
# Verificar se a seção HTTPS está comentada
cat nginx.conf | grep -A 5 "listen 443"
```

**Deve aparecer apenas linhas comentadas com `#`**. Se aparecer linhas sem `#`, você precisa comentá-las.

**Se o arquivo não estiver atualizado no servidor**, faça o pull do git ou atualize manualmente:

```bash
# Se estiver usando git
git pull origin master

# OU copie o conteúdo correto para o arquivo
```

### 4.3. Iniciar apenas o nginx

```bash
sudo docker compose up -d nginx
```

**Verificar se o nginx iniciou corretamente:**

```bash
sudo docker compose logs nginx
```

**Não deve ter erros de SSL!** Se aparecer erro sobre certificado SSL, significa que a seção HTTPS não está comentada.

### 4.4. Executar Certbot para obter certificado

**⚠️ IMPORTANTE: Use `certonly` para OBTER um novo certificado, NÃO use `renew`!**

```bash
docker-compose run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  -d fred-app.telescoope.com.br \
  --email seu-email@exemplo.com \
  --agree-tos \
  --no-eff-email
```

**Substitua:** `seu-email@exemplo.com` pelo seu e-mail real.

**Se bem-sucedido**, você verá:
```
Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/fred-app.telescoope.com.br/fullchain.pem
Key is saved at:         /etc/letsencrypt/live/fred-app.telescoope.com.br/privkey.pem
```

**Se aparecer "no renewals were attempted":**
- Você executou o comando errado! Use `certonly` (não `renew`)
- O comando `renew` só funciona para renovar certificados já existentes
- Pressione Ctrl+C e execute o comando correto acima

## Passo 5: Ativar HTTPS no nginx.conf

Edite o arquivo `nginx.conf` e:

### 5.1. Descomente o redirecionamento HTTP → HTTPS (linhas ~49-51):

```nginx
# Redirect all HTTP to HTTPS
location / {
    return 301 https://$host$request_uri;
}
```

### 5.2. Comente as rotas temporárias HTTP (linhas ~54-79):

```nginx
# Temporary: proxy to services (remove after SSL setup)
# location /api/ {
#     ...
# }
#
# location / {
#     ...
# }
```

### 5.3. Descomente o servidor HTTPS (linhas ~82-143):

Descomente todo o bloco `server { listen 443 ssl http2; ... }` e atualize:

```nginx
server {
    listen 443 ssl http2;
    server_name fred-app.telescoope.com.br;  # ← Altere esta linha

    # SSL certificates (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/fred-app.telescoope.com.br/fullchain.pem;  # ← Altere
    ssl_certificate_key /etc/letsencrypt/live/fred-app.telescoope.com.br/privkey.pem;  # ← Altere
    ...
}
```

## Passo 6: Atualizar variáveis de ambiente

### 6.1. Editar arquivo `.env` na raiz do projeto:

```bash
# .env
NEXT_PUBLIC_API_URL=https://fred-app.telescoope.com.br/api
SECRET_KEY=seu-secret-key-aqui
```

### 6.2. Editar `fred_app_frontend/.env.local`:

```bash
# fred_app_frontend/.env.local
NEXT_PUBLIC_API_URL=https://fred-app.telescoope.com.br/api
```

## Passo 7: Reconstruir e reiniciar todos os containers

```bash
# Parar tudo
docker-compose down

# Reconstruir o frontend com a nova URL da API
docker-compose build frontend

# Iniciar tudo
docker-compose up -d

# Verificar logs
docker-compose logs -f
```

## Passo 8: Verificar a aplicação

1. Abra o navegador e acesse: `https://fred-app.telescoope.com.br`
2. Verifique se o certificado SSL está válido (cadeado verde)
3. Teste as funcionalidades da aplicação

## Passo 9: Configurar renovação automática do certificado

O certificado Let's Encrypt expira a cada 90 dias. O container `certbot` já está configurado para renovar automaticamente, mas você pode testar:

```bash
# Teste de renovação (dry run)
docker-compose run --rm certbot renew --dry-run

# Se o teste passar, a renovação automática está funcionando
```

## Resumo dos Comandos

```bash
# 1. Configurar DNS no painel do domínio (fred-app → IP do servidor)

# 2. No servidor, atualizar o projeto
cd /home/vieira/dev/fred_app
git pull  # se estiver usando git

# 3. Parar containers
docker-compose down

# 4. Obter certificado SSL
docker-compose up -d nginx
docker-compose run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  -d fred-app.telescoope.com.br \
  --email seu-email@exemplo.com \
  --agree-tos \
  --no-eff-email

# 5. Editar nginx.conf (ativar HTTPS)
# 6. Editar .env e fred_app_frontend/.env.local

# 7. Reconstruir e reiniciar
docker-compose down
docker-compose build frontend
docker-compose up -d

# 8. Verificar logs
docker-compose logs -f
```

## Solução de Problemas

### Erro: "Connection refused" ao acessar o domínio
- Verifique se o DNS está propagado: `nslookup fred-app.telescoope.com.br`
- Verifique se as portas 80 e 443 estão abertas no firewall do servidor
- Verifique os logs: `docker-compose logs nginx`

### Erro: "Certificate not found" no Certbot
- Certifique-se de que o DNS está propagado antes de executar o certbot
- Verifique se o nginx está rodando: `docker-compose ps`
- Verifique os logs: `docker-compose logs certbot`

### Erro: "502 Bad Gateway"
- Verifique se backend e frontend estão rodando: `docker-compose ps`
- Verifique os logs: `docker-compose logs backend frontend`
- Aguarde alguns segundos para os containers iniciarem completamente

### Erro: API requests falhando
- Verifique se a variável `NEXT_PUBLIC_API_URL` está correta no `.env.local`
- Reconstrua o frontend: `docker-compose build frontend && docker-compose up -d`

## Checklist Final

- [ ] Registro DNS A configurado
- [ ] DNS propagado (verificado com nslookup)
- [ ] nginx.conf atualizado com o domínio
- [ ] Certificado SSL obtido com sucesso
- [ ] HTTPS habilitado no nginx.conf
- [ ] Variáveis de ambiente atualizadas (.env e .env.local)
- [ ] Frontend reconstruído com nova URL da API
- [ ] Todos os containers rodando (docker-compose ps)
- [ ] Site acessível via HTTPS
- [ ] Certificado SSL válido no navegador
- [ ] Funcionalidades da aplicação testadas

## Contato

Se encontrar problemas, verifique os logs:
```bash
docker-compose logs -f
