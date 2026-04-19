FROM node:22-slim

WORKDIR /app

# Copy server, UI files and initial data
COPY server.js index.html pad.html history.json pad.json ./

EXPOSE 4456

ENV PORT=4456

CMD ["node", "server.js"]
