# syntax=docker/dockerfile:1

# Build stage
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
# Google Analytics ID (public: it shows in the page anyway). GitHub Actions passes the GA_MEASUREMENT_ID repository
# variable; without it the site has no analytics and no cookie notice.
ARG VITE_GA_MEASUREMENT_ID=""
# Google key used only here, to save the reviews into the build (GitHub Actions passes the GOOGLE_MAPS_KEY secret).
# It comes in as a BuildKit secret mount, not ARG/ENV: it is never written to a layer, the image history or the
# build record. Without the secret the build still works and the reviews block is simply hidden.
RUN --mount=type=secret,id=google_maps_key,env=GOOGLE_MAPS_KEY npm run reviews && npm run build

# Production stage
FROM nginx:1.25-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
