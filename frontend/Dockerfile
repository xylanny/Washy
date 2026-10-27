FROM node:26-alpine AS builder
WORKDIR /app
# 项目用 pnpm 管理依赖（见 pnpm-lock.yaml / pnpm-workspace.yaml）
RUN npm install -g pnpm@11
# 先只复制依赖清单，最大化利用缓存
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
# 再复制源码
COPY . .
# 声明构造参数：docker-compose.yml 的 build.args 会传进来
ARG APP_API_BASE_URL=/api
# 构建时以环境变量方式注入（Vite 会读取 process.env）。
# 注意：Vite 里 process.env 的优先级高于 .env.production，
# 如果传进来的是空串，会把 .env.production 里的 /api 覆盖成空，
# 请求就会变成没有 /api 前缀的同源地址，所以这里空值回退到 /api。
RUN APP_API_BASE_URL="${APP_API_BASE_URL:-/api}" pnpm run build

FROM nginx:1.27-alpine
RUN rm -rf /usr/share/nginx/html/* && rm -f /etc/nginx/conf.d/default.conf
# 复制构建阶段生成的dist目录
COPY --from=builder /app/dist /usr/share/nginx/html
# 写入Nginx配置
RUN printf 'server {\n\
    listen 80;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf
# 'try_files $uri $uri/ /index.html'是SPA应用的标准配置
# 用户访问/dashboard，但Nginx找不到/dashboard这个文件则回退/index.html
# 进而交给前端路由处理；若没有该配置，刷新路由会404
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
