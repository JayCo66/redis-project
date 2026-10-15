FROM node:20-alpine

WORKDIR /app

# ติดตั้ง dependencies ก่อนเพื่อใช้ Docker cache
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# คัดลอกซอร์สโค้ดทั้งหมด
COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
