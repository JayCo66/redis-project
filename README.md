# Redis Project

ระบบ Login พร้อมจัดการ Session ด้วย **Redis** โดยเก็บข้อมูลผู้ใช้ใน **MySQL** และใช้ **Express.js** เป็น Backend

## ⚙️ เทคโนโลยีที่ใช้

| เทคโนโลยี | เวอร์ชัน | หน้าที่ |
|---|---|---|
| Node.js | 20+ | Runtime |
| Express.js | 5.x | Web Framework |
| MySQL | 8.0 | เก็บข้อมูลผู้ใช้ |
| Redis | 7.x | เก็บ Session |
| bcrypt | 6.x | Hash รหัสผ่าน |
| Docker | - | จัดการ Infrastructure |

## 🚀 เริ่มต้นใช้งาน

### วิธีที่ 1: ใช้ Docker Compose (แนะนำ ✅)

ไม่ต้องติดตั้ง MySQL หรือ Redis เอง — Docker จัดการให้ทั้งหมด

```bash
# 1. Clone โปรเจกต์
git clone https://github.com/JayCo66/redis-project.git
cd redis-project

# 2. รันทุก Service ด้วยคำสั่งเดียว
docker compose up -d

# 3. เปิดเบราว์เซอร์
# http://localhost:3000
```

> **หมายเหตุ:** ครั้งแรกที่รัน MySQL จะ Import ไฟล์ `schema.sql` ให้อัตโนมัติ (สร้าง Database, ตาราง, และ User ทดสอบ)

#### คำสั่งที่ใช้บ่อย

```bash
# ดู Log ของแอป
docker compose logs -f app

# หยุดทุก Service
docker compose down

# หยุดและลบข้อมูลทั้งหมด (รวม Database)
docker compose down -v
```

---

### วิธีที่ 2: รันเอง (ต้องติดตั้ง MySQL & Redis ในเครื่อง)

#### สิ่งที่ต้องติดตั้งก่อน

- [Node.js](https://nodejs.org/) v20 ขึ้นไป
- [MySQL](https://www.mysql.com/) 8.0
- [Redis](https://redis.io/)

#### ขั้นตอน

```bash
# 1. Clone โปรเจกต์
git clone https://github.com/JayCo66/redis-project.git
cd redis-project

# 2. ติดตั้ง Dependencies
npm install

# 3. ตั้งค่า Environment Variables
cp .env.example .env
# แก้ไขค่าใน .env ให้ตรงกับเครื่องของคุณ

# 4. สร้าง Database และตาราง
mysql -u root -p < schema.sql

# 5. ตรวจสอบว่า MySQL และ Redis เปิดอยู่ แล้วรันแอป
npm start
```

## 🔑 ข้อมูลทดสอบ Login

| Username | Password |
|---|---|
| `admin` | `password123` |

## 📁 โครงสร้างโปรเจกต์

```
redis-project/
├── public/               # ไฟล์ Frontend (HTML, CSS)
│   ├── login.html        # หน้า Login
│   ├── sessions.html     # หน้าดู Session ของตัวเอง
│   ├── sessions-list.html# หน้าดู Session ทั้งหมด
│   ├── unauthorized.html # หน้าแจ้งเตือนไม่มีสิทธิ์
│   └── style.css         # ไฟล์ CSS
├── db.js                 # การเชื่อมต่อ MySQL
├── server.js             # Express.js Server หลัก
├── schema.sql            # โครงสร้าง Database & ข้อมูลทดสอบ
├── Dockerfile            # Docker Image สำหรับแอป
├── docker-compose.yml    # จัดการ MySQL + Redis + App
├── .env.example          # ตัวอย่าง Environment Variables
└── package.json
```

## 📝 ตัวแปร Environment (.env)

| ตัวแปร | ค่าเริ่มต้น | คำอธิบาย |
|---|---|---|
| `PORT` | `3000` | พอร์ตของ Web Server |
| `MYSQL_HOST` | `127.0.0.1` | Host ของ MySQL |
| `MYSQL_PORT` | `3306` | พอร์ตของ MySQL |
| `MYSQL_USER` | `root` | Username สำหรับ MySQL |
| `MYSQL_PASSWORD` | - | รหัสผ่าน MySQL |
| `MYSQL_DATABASE` | `redis_project` | ชื่อ Database |
| `REDIS_URL` | `redis://127.0.0.1:6379` | URL ของ Redis Server |
| `SESSION_SECRET` | - | Secret สำหรับเข้ารหัส Session |
