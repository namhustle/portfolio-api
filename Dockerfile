FROM node:20-alpine AS build-stage

WORKDIR /portfolio_api

COPY package.json .

RUN npm install

COPY . .

RUN npm run build

FROM node:20-alpine AS prod-stage

COPY --from=build-stage /portfolio_api/dist /portfolio_api/dist
COPY --from=build-stage /portfolio_api/package.json /portfolio_api/package.json

WORKDIR /portfolio_api

RUN npm install --production

CMD ["npm", "run", "start:prod"]