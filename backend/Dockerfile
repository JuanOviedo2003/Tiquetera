FROM node:24-slim
WORKDIR /app

# OpenSSL necesario para el motor de Prisma ORM
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install
RUN npx prisma generate

COPY . .

EXPOSE 3000

CMD ["node", "app.js"]
