# Browsers are preinstalled in this image. The default entrypoint runs
# `npx playwright test`, which is exactly what we want for the e2e service.
FROM mcr.microsoft.com/playwright:v1.56.0-noble
WORKDIR /e2e
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
ENTRYPOINT ["npx", "playwright", "test"]
