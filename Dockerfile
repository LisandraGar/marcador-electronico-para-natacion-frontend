# Etapa 1: Build de la aplicación
FROM node:22-alpine AS builder

WORKDIR /app

# Copiar descriptores de dependencias primero para optimizar la caché de Docker
COPY package*.json ./

RUN npm ci

# Copiar el código fuente
COPY . .

# Compilar para producción
RUN npm run build

# Etapa 2: Servidor web ultraligero Nginx
FROM nginx:1.27-alpine

# Copiar la configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar los archivos compilados desde la etapa builder
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
