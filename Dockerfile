FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies first to leverage Docker cache
COPY package.json bun.lock ./
# Use --frozen-lockfile for reproducible installs
RUN bun install --frozen-lockfile

# Copy the rest of the application code
COPY . .
RUN rm -fv status_app.sqlite

# Build the frontend (output will be in /app/dist)
RUN bun run build

# Expose the port the app runs on
EXPOSE 3000

# Define the command to run the backend server
# It will serve the static files from /app/dist and handle API/WS requests
CMD ["bun", "run", "backend/server.js"]
