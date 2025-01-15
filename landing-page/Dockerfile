FROM nginx:alpine

# Copy pre-built dist/web directory to nginx's default serve directory
COPY dist/web/ /usr/share/nginx/html/

# Expose port 80 (standard HTTP port)
EXPOSE 80

# nginx will start automatically, no need for explicit CMD 