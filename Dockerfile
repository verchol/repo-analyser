FROM node:latest

RUN npm install -g mocha
COPY package.json /src/package.json
WORKDIR /src
RUN npm install

COPY ./  /src
CMD node /src/bin/www
