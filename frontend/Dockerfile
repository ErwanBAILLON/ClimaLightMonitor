FROM node:22-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./

RUN npm install

# Bundle app source
COPY . .

ARG NEXT_PUBLIC_API_URL
RUN echo NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} > .env.local

RUN npm run build

CMD [ "npm", "start" ]