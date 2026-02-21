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
RUN bun build ./index.ts --compile --outfile ./server




# Stage 2: Runtime image (Debian slim, glibc‑compatible)
FROM debian:bookworm-slim

WORKDIR /app

# Copy the compiled binary from the build stage
COPY --from=build /app/server /app/server

# Make the binary executable
RUN chmod +x /app/server

# Expose app port
EXPOSE 3000

# Run the binary
ENTRYPOINT ["/app/server"]
