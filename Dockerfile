# syntax=docker/dockerfile:1
#
# Builds apps/api or apps/indexer for self-hosted deployment. Both share the
# identical workspace build chain (@tip/db -> @tip/core -> @tip/moderation ->
# the app), so one file produces two independently taggable images.
#
# Build (from the repository root):
#   docker build --target api      -t tip-api      .            # APP defaults to api
#   docker build --target indexer --build-arg APP=indexer -t tip-indexer .
#
# --build-arg APP and --target must agree (APP=api with --target api, or
# APP=indexer with --target indexer): APP controls what the builder/prod-deps
# stages install and compile, --target controls which final image (and its
# literal CMD/EXPOSE) gets produced. A mismatch fails the build with a clear
# "no such file" on the final COPY, not a silently wrong image.

# ==============================================================================
# base: Node 24 on Debian bookworm-slim (not Alpine), pnpm 11.15.1 pinned via
# Corepack. Shared by builder and prod-deps so both install passes use the
# exact same pnpm version and OS/libc.
# ==============================================================================
FROM node:24-bookworm-slim AS base
RUN corepack enable && corepack prepare pnpm@11.15.1 --activate
WORKDIR /app

# ==============================================================================
# builder: the proven Render build sequence (render.yaml / DEPLOYMENT.md),
# run from the repository root, never `turbo run build`. Full install
# (dev dependencies included -- @tip/db's build needs the `prisma` CLI),
# then the four packages in their required order.
# ==============================================================================
FROM base AS builder
ARG APP=api

# Manifests only, first: this layer only invalidates when a package.json,
# the lockfile, or the workspace config changes. pnpm's frozen-lockfile
# install needs every workspace member's manifest present to validate
# against pnpm-lock.yaml, even the ones this image never builds.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/docs/package.json apps/docs/package.json
COPY apps/indexer/package.json apps/indexer/package.json
COPY apps/landing/package.json apps/landing/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/core/package.json packages/core/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/moderation/package.json packages/moderation/package.json
COPY packages/sdk/package.json packages/sdk/package.json

RUN pnpm install --frozen-lockfile

# Real source only for what actually gets built: the three shared packages
# and the selected app. apps/docs, apps/landing, apps/web, packages/sdk
# never get their source copied in -- their manifests above were only needed
# to satisfy the workspace-wide install.
COPY packages/core/ packages/core/
COPY packages/db/ packages/db/
COPY packages/moderation/ packages/moderation/
COPY apps/${APP}/ apps/${APP}/

RUN pnpm --filter @tip/db build \
 && pnpm --filter @tip/core build \
 && pnpm --filter @tip/moderation build \
 && pnpm --filter @tip/${APP} build

# ==============================================================================
# prod-deps: a second, independent install pass -- production dependencies
# only, filtered to @tip/${APP} and its workspace dependency graph. This is
# what keeps the runtime image scoped to what the selected app actually
# needs: an unfiltered install would also pull in every dependency of
# apps/docs, apps/landing, apps/web, and packages/sdk (Next.js, HeroUI,
# fumadocs, R3F, GSAP, ...), none of which apps/api or apps/indexer import.
# ==============================================================================
FROM base AS prod-deps
ARG APP=api

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/api/package.json apps/api/package.json
COPY apps/docs/package.json apps/docs/package.json
COPY apps/indexer/package.json apps/indexer/package.json
COPY apps/landing/package.json apps/landing/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/core/package.json packages/core/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/moderation/package.json packages/moderation/package.json
COPY packages/sdk/package.json packages/sdk/package.json

RUN pnpm install --frozen-lockfile --prod --filter "@tip/${APP}..."

# ==============================================================================
# runtime-base: shared runtime filesystem for the workspace packages every
# app needs (@tip/core, @tip/db, @tip/moderation) -- compiled dist/ output
# only, no .ts sources, no tests, no prisma/schema.prisma (schema.prisma is a
# `prisma generate`/`prisma migrate` input; the driver-adapter client never
# reads it at runtime). No pnpm/Corepack here at all: the runtime image only
# ever runs `node`, never a pnpm command, so it doesn't need it installed.
# ==============================================================================
FROM node:24-bookworm-slim AS runtime-base
ENV NODE_ENV=production
WORKDIR /app

# node:24-bookworm-slim ships an unprivileged "node" user (uid/gid 1000)
# out of the box; reuse it instead of provisioning a new one.
COPY --from=prod-deps --chown=node:node /app/package.json /app/pnpm-workspace.yaml ./
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=prod-deps --chown=node:node /app/packages/core/package.json ./packages/core/package.json
COPY --from=prod-deps --chown=node:node /app/packages/core/node_modules ./packages/core/node_modules
COPY --from=prod-deps --chown=node:node /app/packages/db/package.json ./packages/db/package.json
COPY --from=prod-deps --chown=node:node /app/packages/db/node_modules ./packages/db/node_modules
COPY --from=prod-deps --chown=node:node /app/packages/moderation/package.json ./packages/moderation/package.json
COPY --from=prod-deps --chown=node:node /app/packages/moderation/node_modules ./packages/moderation/node_modules

COPY --from=builder --chown=node:node /app/packages/core/dist ./packages/core/dist
COPY --from=builder --chown=node:node /app/packages/db/dist ./packages/db/dist
COPY --from=builder --chown=node:node /app/packages/moderation/dist ./packages/moderation/dist

# ==============================================================================
# indexer: adds only @tip/indexer's own dependencies and compiled output.
# Background worker -- no HTTP port, so no EXPOSE.
# ==============================================================================
FROM runtime-base AS indexer

COPY --from=prod-deps --chown=node:node /app/apps/indexer/package.json ./apps/indexer/package.json
COPY --from=prod-deps --chown=node:node /app/apps/indexer/node_modules ./apps/indexer/node_modules
COPY --from=builder --chown=node:node /app/apps/indexer/dist ./apps/indexer/dist

USER node
CMD ["node", "apps/indexer/dist/main.js"]

# ==============================================================================
# api: adds only @tip/api's own dependencies and compiled output. Default
# build target (last stage in the file) -- `docker build .` with no
# --target produces this image.
# ==============================================================================
FROM runtime-base AS api

COPY --from=prod-deps --chown=node:node /app/apps/api/package.json ./apps/api/package.json
COPY --from=prod-deps --chown=node:node /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder --chown=node:node /app/apps/api/dist ./apps/api/dist

USER node
EXPOSE 3000
CMD ["node", "apps/api/dist/main.js"]
