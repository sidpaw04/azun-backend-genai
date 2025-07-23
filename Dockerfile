# Use an official Node.js runtime as a parent image
# We use the 'slim' version for a smaller image size
FROM node:20-slim

# Create a directory for your application code inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if you use it)
# to take advantage of Docker's layer caching.
# This ensures npm install is only re-run if dependencies change.
COPY package*.json ./

# Install application dependencies
RUN npm install

# Copy the rest of your application source code to the container
# This includes your src folder and tsconfig.json etc.
COPY . .

# Build your TypeScript code (if you have a 'build' script)
# This will compile your TS into JS, typically in a 'dist' folder
RUN npm run build

# Expose the port your application listens on
# Cloud Run expects your application to listen on PORT, which it sets as an environment variable
ENV PORT 4000
EXPOSE ${PORT}

# Define the command to run your application
# This assumes your 'start' script runs the compiled JS (e.g., node dist/server.js)
CMD ["npm", "start"]