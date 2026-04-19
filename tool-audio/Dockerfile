FROM node:22-slim

WORKDIR /app

# No dependencies means no package.json needed for npm install
# But we copy server.js, index.html, and a skeleton history.json
COPY server.js index.html history.json ./

EXPOSE 4456

ENV PORT=4456

CMD ["node", "server.js"]
