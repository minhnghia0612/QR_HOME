# --- Build Stage ---
FROM node:20-alpine AS builder

WORKDIR /app

ARG VITE_GOOGLE_AUTH_URL=/api/auth/google
ENV VITE_GOOGLE_AUTH_URL=$VITE_GOOGLE_AUTH_URL

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# --- Production Stage (Nginx) ---
FROM nginx:alpine AS production

ARG BACKEND_URL=http://backend:3000
ENV BACKEND_URL=$BACKEND_URL

COPY --from=builder /app/dist /usr/share/nginx/html

RUN printf 'server {\n\
  listen 80;\n\
  root /usr/share/nginx/html;\n\
  index index.html;\n\
  location / {\n\
    try_files $uri $uri/ /index.html;\n\
  }\n\
  location /socket.io/ {\n\
    proxy_pass %s/socket.io/;\n\
    proxy_http_version 1.1;\n\
    proxy_set_header Upgrade $http_upgrade;\n\
    proxy_set_header Connection "Upgrade";\n\
    proxy_set_header Host $host;\n\
  }\n\
  location /api {\n\
    proxy_pass %s;\n\
    proxy_set_header Host $host;\n\
    proxy_set_header X-Real-IP $remote_addr;\n\
  }\n\
  location /uploads {\n\
    proxy_pass %s;\n\
  }\n\
}\n' "$BACKEND_URL" "$BACKEND_URL" "$BACKEND_URL" > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
