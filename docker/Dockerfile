# Use Node.js LTS version
FROM node:24-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm i --omit=dev

# Copy application source
COPY src/ ./src/
COPY templates/ ./templates/

# Create cache directory
RUN mkdir -p .cache

# Set Node environment
ENV NODE_ENV=production

# Run the scheduler
CMD ["node", "src/index.js"]
