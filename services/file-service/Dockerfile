FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --only=production || npm install
COPY src ./src
EXPOSE 8082
CMD ["npm", "start"]


