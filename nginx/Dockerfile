FROM node:24-alpine AS frontend-build

WORKDIR /app

COPY frontend/package*.json ./

RUN npm ci

COPY frontend/ ./

RUN npm run build


FROM nginx:1.31.6-alpine

COPY nginx/default.conf \
    /etc/nginx/conf.d/default.conf

COPY --from=frontend-build \
    /app/dist \
    /usr/share/nginx/html

RUN chmod -R a+rX \
    /usr/share/nginx/html

EXPOSE 80
