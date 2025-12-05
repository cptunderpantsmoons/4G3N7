# Base image
FROM node:20-alpine

# Declare build arguments
ARG G3N7_AGENT_BASE_URL
ARG G3N7_DESKTOP_VNC_URL

# Set environment variables for the build process
ENV G3N7_AGENT_BASE_URL=${G3N7_AGENT_BASE_URL}
ENV G3N7_DESKTOP_VNC_URL=${G3N7_DESKTOP_VNC_URL}

# Create app directory
WORKDIR /app

# Copy app source
COPY ./shared ./shared
COPY ./bytebot-ui/ ./bytebot-ui

WORKDIR /app/bytebot-ui

# Install dependencies
RUN npm install

RUN npm run build

# Run the application
CMD ["npm", "run", "start"] 


