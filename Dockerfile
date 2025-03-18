FROM node:23

WORKDIR /usr/src/app

COPY . .

RUN npm install

RUN npm run build

run rm -rf ./src

EXPOSE 3000

ENV NODE_ENV docker

CMD  ["npm", "run", "start:prod"]