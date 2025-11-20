FROM mcr.microsoft.com/devcontainers/base:ubuntu-24.04

# Install Node.js 18.x
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends curl ca-certificates \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get -y install --no-install-recommends nodejs \
    && apt-get clean -y && rm -rf /var/lib/apt/lists/*

# Verify installation
RUN node --version && npm --version
