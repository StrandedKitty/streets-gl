FROM node:19 as builder

RUN apt-get install -y --no-install-recommends git

WORKDIR /usr/src/builder

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

FROM node:19-alpine as runner
WORKDIR /usr/src/app

COPY --from=builder /usr/src/builder/build ./build
COPY --from=builder /usr/src/builder/package.json ./

RUN apk add pngquant

RUN find ./build/models \
    ./build/textures/buildings \
    ./build/textures/surfaces \
    -type f -name "*.png" \
    -exec pngquant --force --quality 65-80 --skip-if-larger --output {} {} \;

RUN npm install http-server

EXPOSE 8080
CMD ["npm", "start"]