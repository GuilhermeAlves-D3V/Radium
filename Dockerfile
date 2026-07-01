FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json

RUN npm install

COPY . .

RUN npm run build

ENV HOST=0.0.0.0
ENV PORT=4100

EXPOSE 4100

CMD ["npm", "run", "start"]

