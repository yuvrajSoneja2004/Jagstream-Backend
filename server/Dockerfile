FROM node:18-bullseye

WORKDIR /app

COPY package*.json ./

RUN apt-get update && apt-get install -y libssl1.1 bash curl

COPY . .

RUN npx prisma generate

RUN mkdir -p temp tempHLS uploads tempThumbnails

EXPOSE 3005

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3005/ || exit 1

CMD ["npx", "nodemon", "--exec", "ts-node", "--transpile-only", "index.ts"]
