# Build stage
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
# Google key used only here, to save the reviews into the build (GitHub Actions passes the GOOGLE_MAPS_KEY secret).
# It is a build argument, not an ENV, and the build stage is thrown away: the key never reaches the image or the site.
ARG GOOGLE_MAPS_KEY
RUN npm run reviews && npm run build

# Production stage
FROM nginx:1.25-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
