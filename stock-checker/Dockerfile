# Pokémon stock checker — 24/7 container.
#
# Plain mode (no browser rendering):
#   docker build -t poke-checker .
#   docker run -d --restart unless-stopped \
#     -v $(pwd)/config.json:/app/config.json \
#     -v $(pwd)/data:/app/data \
#     --name poke-checker poke-checker
#
# Browser mode (JS-rendered sites):
#   docker build --build-arg WITH_BROWSER=1 -t poke-checker .
#   docker run -d --restart unless-stopped \
#     -v $(pwd)/preorders.json:/app/preorders.json \
#     -v $(pwd)/data:/app/data \
#     --name poke-checker poke-checker \
#     node checker.mjs --config preorders.json --browser
#
# Tip: set "stateFile": "data/state.json" in your config so stock state
# survives container restarts via the ./data volume.

ARG WITH_BROWSER=0

FROM node:22-slim AS base
WORKDIR /app
COPY checker.mjs ./
RUN mkdir -p /app/data

# --- plain variant: nothing extra needed -------------------------------------
FROM base AS browser-0

# --- browser variant: playwright + chromium + system deps --------------------
FROM base AS browser-1
RUN npm install playwright --no-audit --no-fund \
  && npx playwright install --with-deps chromium \
  && rm -rf /root/.npm

FROM browser-${WITH_BROWSER} AS final
# Config is mounted at runtime, never baked in (it holds webhook tokens).
CMD ["node", "checker.mjs"]
