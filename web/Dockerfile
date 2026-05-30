# Static site served by nginx. No build step — the page is plain HTML/CSS/JS.
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY public/ /usr/share/nginx/html/
EXPOSE 80
# busybox wget: plain GET (no --spider), loopback IP (not "localhost").
HEALTHCHECK --interval=10s --timeout=5s --retries=10 --start-period=15s \
  CMD wget -q -O /dev/null http://127.0.0.1:80/ || exit 1
