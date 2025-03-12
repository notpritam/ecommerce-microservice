FROM node:18-alpine

# Installing PNPM Here

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /usr/src/app

# Copying package.json and tsconfig.json here

COPY package.json pnpm-lock.yaml* tsconfig.json ./

# Now i am installing dependencies here

RUN pnpm install

COPY src/ ./src/

# I am building the project here

RUN pnpm build

EXPOSE 3001

# I am running the project here

CMD ["pnpm", "dev"]