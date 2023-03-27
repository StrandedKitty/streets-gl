FROM node:14 as builder

RUN apt-get install -y --no-install-recommends git

WORKDIR /usr/src/builder

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

FROM node:14-alpine as runner
WORKDIR /usr/src/app

COPY --from=builder /usr/src/builder/build ./build
COPY --from=builder /usr/src/builder/package.json ./

RUN npm install http-server

EXPOSE 8080
CMD ["npm", "start"]