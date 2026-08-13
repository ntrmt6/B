# Use Node.js LTS
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install ALL dependencies (including dev) — the TypeScript build needs
# typescript and @types/* which live in devDependencies.
COPY package*.json ./
RUN npm ci

# Copy source code and build TypeScript -> dist/
COPY . .
RUN npm run build

# Drop dev dependencies now that the build is done, to shrink the image.
RUN npm prune --omit=dev

# Expose port (hosts like Render/Railway inject their own PORT, which the
# app reads from process.env.PORT and overrides this default)
EXPOSE 5001

ENV NODE_ENV=production
ENV PORT=5001

# Start the compiled server
CMD ["npm", "start"]
