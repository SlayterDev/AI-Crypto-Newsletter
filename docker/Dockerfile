# Use Node.js LTS version
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application source
COPY src/ ./src/
COPY templates/ ./templates/

# Create cache directory
RUN mkdir -p .cache

# Set Node environment
ENV NODE_ENV=production

# Run the scheduler
CMD ["node", "src/index.js"]
