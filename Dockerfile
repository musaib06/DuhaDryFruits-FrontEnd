# # Stage 1: Angular Build
# FROM node:20 AS build
# WORKDIR /app

# COPY package*.json ./

# # Install dependencies
# RUN npm install

# # Copy project source
# COPY . .

# # Build Angular for production
# RUN npm run build-prod

# # Stage 2: Serve with Nginx
# FROM nginx:stable-alpine

# # Copy built Angular files
# COPY --from=build /app/dist/duha-dryfruits/browser /usr/share/nginx/html

# # Copy custom nginx config
# Use Node 22
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
COPY patches ./patches/

# npm ci fails on strict peer trees (e.g. Angular/ng-bootstrap); --force matches local workarounds for Railway.
# patches/ must exist before install so postinstall (patch-package) can fix CommonEngine allowedHosts forwarding.
RUN npm install --force

COPY . .

# Firebase messaging service worker lives in public/ and is emitted to the web
# root by the Angular build, so no manual copy is required here.

# Call Angular CLI directly so the image builds even if package.json scripts differ on the deployed branch.
# Equivalent to: npm run build:ssr / npm run build:prod
RUN npx ng build --configuration production

# Railway injects PORT at runtime (often not 8080). The Node server reads process.env.PORT — do not
# hardcode the listen port here. EXPOSE is informational for local `docker run -p`.
# Local example: docker run -e PORT=8080 -p 8080:8080 <image>
EXPOSE 8080

# Same as `npm run serve:ssr` but explicit argv so server.ts can detect the entry script.
# Must match the path under /app after build (see angular.json outputPath / project name).
CMD ["node", "dist/duha-dryfruits/server/server.mjs"]