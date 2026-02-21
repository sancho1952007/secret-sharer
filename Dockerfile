# Stage 1: Build and compile the Bun server
FROM oven/bun:1-alpine AS build

WORKDIR /app

# Copy dependencies first
COPY bun.lock package.json ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy the server file (no src folder)
COPY index.ts ./

# Compile the server into a standalone binary
RUN bun build ./index.ts --compile --outfile ./server



# Stage 2: Runtime image with only the binary
FROM alpine:3.20

WORKDIR /app

# Copy the compiled binary
COPY --from=build /app/server /app/server

# Make it executable
RUN chmod +x /app/server

# Expose app
EXPOSE 3000

# Run the binary
ENTRYPOINT ["/app/server"]