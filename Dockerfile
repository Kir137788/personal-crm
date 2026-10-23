FROM node:24-bookworm-slim AS build
WORKDIR /app
RUN npm install -g pnpm@12.15.0
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN DATABASE_URL=postgres://build:build@127.0.0.1:5432/build pnpm build
ENV NODE_ENV=production
USER node
EXPOSE 3000
CMD ["pnpm", "exec", "next", "start", "--hostname", "0.0.0.0"]
