FROM node:18-alpine
WORKDIR /app
COPY apps/api/package*.json ./
RUN npm install
COPY apps/api/src ./src
COPY apps/api/database ./database
EXPOSE 5000
CMD ["npm", "start"]
