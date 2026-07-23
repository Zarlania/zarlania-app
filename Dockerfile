# syntax=docker/dockerfile:1

# Render deploys this app as a Static Site and builds it itself, so this image is
# not part of the production path. It exists for local development (the `dev`
# target, used by docker-compose.yml) and to prove in CI that the app builds and
# serves correctly in a container.

# ---------- Dependencies ----------
FROM node:24-alpine AS deps
WORKDIR /app
# Copy only the manifests first so the dependency layer is cached independently
# of source changes.
COPY package.json package-lock.json ./
RUN npm ci

# ---------- Development ----------
# Runs the Vite dev server with hot module replacement. Source is bind-mounted
# by Compose, so it is deliberately not copied in here.
FROM node:24-alpine AS dev
WORKDIR /app
ENV NODE_ENV=development
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# ---------- Build ----------
FROM node:24-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# VITE_ variables are baked into the bundle at build time, not read at runtime.
ARG VITE_API_URL=""
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

# ---------- Production-like runtime ----------
FROM nginx:1.31-alpine AS runtime

ARG APP_VERSION=0.0.0-dev
LABEL org.opencontainers.image.title="zarlania-app" \
      org.opencontainers.image.description="Official web application for Zarlania" \
      org.opencontainers.image.source="https://github.com/Zarlania/zarlania-app" \
      org.opencontainers.image.licenses="MIT" \
      org.opencontainers.image.version="${APP_VERSION}"

COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY nginx/snippets/ /etc/nginx/snippets/
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
