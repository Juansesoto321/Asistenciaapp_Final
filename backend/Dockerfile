FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
# npm ci instala exactamente lo del package-lock.json (builds reproducibles)
RUN npm ci --omit=dev
COPY src ./src
# No correr como root dentro del contenedor
USER node
EXPOSE 4000
CMD ["node", "src/app.js"]
