# Base image
FROM node:18-slim

# Create app directory
WORKDIR /app

# Copy package.json and install production dependencies
COPY package*.json ./
RUN npm install --production

# Copy backend source
COPY server.js ./
COPY data ./data

# Copy built frontend
COPY frontend/dist ./frontend/dist

# Expose port
EXPOSE 4455

# Set environment variables
ENV NODE_ENV=production
ENV PORT=4455

# Run the server
CMD ["node", "server.js"]
