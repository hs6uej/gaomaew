# Stage 1: Build the frontend
FROM node:22-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Final production image
FROM node:22-slim
WORKDIR /app

# Copy backend dependencies
COPY package*.json ./
RUN npm install --production

# Copy backend server and static data
COPY server.js ./
COPY data ./data

# Copy built frontend from Stage 1
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Expose port and run
EXPOSE 4455
ENV NODE_ENV=production
ENV PORT=4455
CMD ["node", "server.js"]
