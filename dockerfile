# build-stage
FROM node:18-alpine AS build-stage
WORKDIR /usr/src/app
COPY package*.json ./
COPY yarn.lock ./
COPY .env.development ./.env.development 
COPY .env.production ./.env.production 
COPY .env.dods ./.env.dods 
RUN yarn
COPY . .
RUN yarn global add typescript cross-env
RUN tsc 

# runtime-stage
FROM node:18-alpine AS runtime-stage
WORKDIR /usr/src/app
RUN yarn global add forever 
COPY --from=build-stage /usr/src/app/dist ./dist
COPY --from=build-stage /usr/src/app/.env.production ./.env.production
COPY --from=build-stage /usr/src/app/.env.development ./.env.development
COPY --from=build-stage /usr/src/app/.env.dods ./.env.dods
COPY package*.json ./
COPY yarn.lock ./
RUN yarn --production=true  # 只安装 production 依赖
EXPOSE 3000
# CMD ["npx", "cross-env", "NODE_ENV=production", "forever", "dist/app.js"]
# CMD ["npx", "cross-env", "NODE_ENV=tods", "forever", "dist/app.js"]
  CMD ["npx", "cross-env", "NODE_ENV=dods", "forever", "dist/app.js"]