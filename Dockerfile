FROM node:18-alpine

WORKDIR /app

# Install dependencies for Puppeteer (WhatsApp Web)
# Utilizing chromium from alpine repo to avoid downloading chrome every time
RUN apk add --no-cache \
      chromium \
      nss \
      freetype \
      harfbuzz \
      ca-certificates \
      ttf-freefont \
      nodejs \
      yarn

# Tell Puppeteer to skip installing Chrome. We'll be using the installed package.
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

COPY package*.json ./
RUN npm install

COPY . .

# Generate Prisma Client (if using Prisma)
# RUN npx prisma generate

RUN npm run build

EXPOSE 4000

CMD ["npm", "start"]
