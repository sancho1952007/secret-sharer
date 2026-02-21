# Stage 1: Build using the official Bun image
FROM oven/bun:1 AS build

WORKDIR /app

# Copy lock and manifest first
COPY bun.lock package.json ./

# Install dependencies (frozen lockfile)
RUN bun install --frozen-lockfile

# Copy your server and public files
COPY index.ts ./
COPY public/ ./public/

# Build the server into a single executable binary
RUN bun build ./index.ts --bundle --minify --compile --outfile ./server




# Stage 2: Run the executable
FROM gcr.io/distroless/base-debian11

WORKDIR /app

COPY --from=build /app/server /app/server

EXPOSE 3000

ENTRYPOINT ["/app/server"]