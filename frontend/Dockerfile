FROM node:20

WORKDIR /app
COPY package.json package-lock.json* tsconfig.json next.config.js ./
RUN npm install

COPY pages ./pages
CMD ["npm", "run", "dev"]

