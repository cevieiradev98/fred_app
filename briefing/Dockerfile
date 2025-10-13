# Use Node.js LTS version
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy application files
COPY server.js .
COPY briefing-ineep.html .

# Create data directory for persistent storage
RUN mkdir -p /app/data

# Expose port (default 4000, can be overridden via PORT env var)
EXPOSE 4000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=4000

# Run the application
CMD ["node", "server.js"]
