FROM node:20.19.0 AS build-stage

WORKDIR /app

# 设置 Node.js 内存限制，避免大型前端构建 OOM
ENV NODE_OPTIONS="--max-old-space-size=8192"

RUN corepack enable
RUN corepack prepare pnpm@10.0.0 --activate

RUN npm config set registry https://registry.npmmirror.com

COPY .npmrc package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# 默认使用 production 模式构建；testing 模式映射到 staging 构建
ARG BUILD_MODE=production
RUN if [ "$BUILD_MODE" = "testing" ]; then pnpm build:staging; else pnpm build; fi

FROM nginx:1.27.4 AS production-stage

COPY --from=build-stage /app/dist /usr/share/nginx/html
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]