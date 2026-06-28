#!/bin/bash
# ==============================================
# 肠安地图 — 阿里云服务器部署脚本
# 在新开通的阿里云 ECS 上以 root 执行
# ==============================================
set -e

echo "========================================="
echo "  肠安地图 — 服务器部署"
echo "========================================="

# ─── 1. 系统更新 + 基础工具 ───
echo "[1/8] 更新系统..."
apt update && apt upgrade -y
apt install -y curl git ufw nginx certbot python3-certbot-nginx

# ─── 2. 安装 Docker ───
echo "[2/8] 安装 Docker..."
if ! command -v docker &> /dev/null; then
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
fi

# ─── 3. 安装 Docker Compose ───
echo "[3/8] 安装 Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
  curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
  chmod +x /usr/local/bin/docker-compose
fi

# ─── 4. 配置防火墙 ───
echo "[4/8] 配置防火墙..."
ufw allow 22
ufw allow 80
ufw allow 443
ufw --force enable

# ─── 5. 拉取代码 ───
echo "[5/8] 拉取代码..."
if [ ! -d /opt/gutsafe ]; then
  git clone https://github.com/XilentD/gutsafe.git /opt/gutsafe
else
  cd /opt/gutsafe && git pull
fi

# ─── 6. 配置环境变量 ───
echo "[6/8] 配置环境变量..."
cd /opt/gutsafe
if [ ! -f .env.production ]; then
  echo "请复制 .env.production 模板并填写真实值："
  echo "  cp scripts/deploy/.env.production .env.production"
  echo "  vim .env.production"
  echo ""
  read -p "已完成？(y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "请先配置 .env.production 再重新运行此脚本"
    exit 1
  fi
fi

# ─── 7. 启动服务 ───
echo "[7/8] 启动服务..."
cd /opt/gutsafe
set -a && source .env.production && set +a
docker-compose -f scripts/deploy/docker-compose.prod.yml up -d --build

# ─── 8. 配置 Nginx 反向代理 ───
echo "[8/8] 配置 Nginx..."
cat > /etc/nginx/sites-available/gutsafe << 'NGINX'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    client_max_body_size 10m;
}
NGINX

ln -sf /etc/nginx/sites-available/gutsafe /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# ─── 完成 ───
echo ""
echo "========================================="
echo "  ✅ 部署完成！"
echo "========================================="
echo ""
echo "访问地址: http://$(curl -s ifconfig.me)"
echo ""
echo "后续操作:"
echo "  配置 HTTPS:  certbot --nginx -d your-domain.com"
echo "  查看日志:    docker-compose -f /opt/gutsafe/scripts/deploy/docker-compose.prod.yml logs -f"
echo "  重启服务:    docker-compose -f /opt/gutsafe/scripts/deploy/docker-compose.prod.yml restart"
echo ""
