# Hướng Dẫn Setup Database MongoDB Thủ Công

Hướng dẫn chi tiết từng bước để setup MongoDB database cho dự án này.

## Bước 1: Cài đặt MongoDB

### Option A: MongoDB Atlas (Cloud - Khuyến nghị cho Production)

1. **Truy cập MongoDB Atlas:**
   - Vào: https://www.mongodb.com/cloud/atlas/register
   - Đăng ký tài khoản (miễn phí)

2. **Tạo Cluster:**
   - Click **"Build a Database"**
   - Chọn **FREE (M0)** tier
   - Chọn Cloud Provider và Region (gần bạn nhất)
   - Đặt tên cluster (ví dụ: `Cluster0`)
   - Click **"Create"**
   - Đợi 3-5 phút để cluster được tạo

3. **Tạo Database User:**
   - Vào tab **"Database Access"** (bên trái)
   - Click **"Add New Database User"**
   - Chọn **"Password"** authentication
   - Nhập:
     - Username: `siftly_user` (hoặc tên bạn muốn)
     - Password: Tạo password mạnh (lưu lại để dùng sau)
   - Database User Privileges: Chọn **"Read and write to any database"**
   - Click **"Add User"**

4. **Whitelist IP Address:**
   - Vào tab **"Network Access"** (bên trái)
   - Click **"Add IP Address"**
   - Click **"Allow Access from Anywhere"** (hoặc thêm IP cụ thể)
   - Click **"Confirm"**

5. **Lấy Connection String:**
   - Vào tab **"Database"** (bên trái)
   - Click **"Connect"** trên cluster của bạn
   - Chọn **"Connect your application"**
   - Driver: **Node.js**, Version: **5.5 or later**
   - Copy connection string, có dạng:
     ```
     mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```
   - Thay `<username>` bằng username bạn đã tạo (ví dụ: `siftly_user`)
   - Thay `<password>` bằng password bạn đã tạo
   - Thêm tên database vào cuối: `?retryWrites=true&w=majority` → `?retryWrites=true&w=majority` (hoặc thêm `/siftly` trước `?`)
   - Kết quả cuối cùng:
     ```
     mongodb+srv://siftly_user:your_password@cluster0.xxxxx.mongodb.net/siftly?retryWrites=true&w=majority
     ```

### Option B: MongoDB Local (Development)

#### Windows:

1. **Download MongoDB:**
   - Vào: https://www.mongodb.com/try/download/community
   - Chọn:
     - Version: Latest (7.0+)
     - Platform: Windows
     - Package: MSI
   - Click **Download**

2. **Cài đặt:**
   - Chạy file `.msi` đã download
   - Chọn **"Complete"** installation
   - Chọn **"Install MongoDB as a Service"**
   - Chọn **"Run service as Network Service user"**
   - Click **"Install"**

3. **Kiểm tra MongoDB đang chạy:**
   - Mở Command Prompt
   - Chạy: `mongod --version`
   - Nếu thấy version, MongoDB đã được cài đặt

4. **Connection String:**
   ```
   mongodb://localhost:27017/siftly
   ```

#### macOS:

```bash
# Cài đặt Homebrew (nếu chưa có)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Cài đặt MongoDB
brew tap mongodb/brew
brew install mongodb-community

# Khởi động MongoDB
brew services start mongodb-community

# Kiểm tra
mongod --version
```

**Connection String:**
```
mongodb://localhost:27017/siftly
```

#### Linux (Ubuntu/Debian):

```bash
# Import MongoDB public GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# Tạo list file
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Update package database
sudo apt-get update

# Cài đặt MongoDB
sudo apt-get install -y mongodb-org

# Khởi động MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Kiểm tra
mongod --version
```

**Connection String:**
```
mongodb://localhost:27017/siftly
```

---

## Bước 2: Set DATABASE_URL

### Cách 1: Tạo file .env (Khuyến nghị)

1. **Tạo file `.env`** trong root directory của project:
   ```
   e:\AMY_Technology_LLC\1-siftly\.env
   ```

2. **Thêm DATABASE_URL vào file:**
   
   **Nếu dùng MongoDB Atlas:**
   ```
   DATABASE_URL=mongodb+srv://siftly_user:your_password@cluster0.xxxxx.mongodb.net/siftly?retryWrites=true&w=majority
   ```
   
   **Nếu dùng MongoDB Local:**
   ```
   DATABASE_URL=mongodb://localhost:27017/siftly
   ```

3. **Lưu file**

### Cách 2: Set Environment Variable trong Terminal

#### Windows (PowerShell):
```powershell
$env:DATABASE_URL="mongodb://localhost:27017/siftly"
# hoặc
$env:DATABASE_URL="mongodb+srv://siftly_admin:<db_password>@cluster0.repfqbv.mongodb.net/?appName=Cluster0"
```

#### Windows (CMD):
```cmd
set DATABASE_URL=mongodb://localhost:27017/siftly
```

#### macOS/Linux:
```bash
export DATABASE_URL="mongodb://localhost:27017/siftly"
# hoặc
export DATABASE_URL="mongodb+srv://siftly_user:your_password@cluster0.xxxxx.mongodb.net/siftly?retryWrites=true&w=majority"
```

### Cách 3: Set trong Replit Secrets

1. Vào Replit project
2. Click icon **Secrets** (khóa) ở sidebar
3. Click **"New Secret"**
4. Key: `DATABASE_URL`
5. Value: Connection string của bạn
6. Click **"Add Secret"**

---

## Bước 3: Cài đặt Dependencies

Đảm bảo các packages đã được cài đặt:

```bash
npm install
```

Kiểm tra `package.json` có:
- `mongoose`: ^8.0.0
- `@types/mongoose`: ^5.11.97 (trong devDependencies)

---

## Bước 4: Kiểm tra Kết nối

1. **Chạy server:**
   ```bash
   npm run dev
   ```

2. **Kiểm tra log:**
   - Nếu thành công, bạn sẽ thấy:
     ```
     MongoDB connected successfully
     serving on port 5000
     ```
   
   - Nếu có lỗi, kiểm tra:
     - DATABASE_URL đã được set đúng chưa
     - MongoDB server đang chạy (nếu dùng local)
     - Username/password đúng (nếu dùng Atlas)
     - IP đã được whitelist (nếu dùng Atlas)

---

## Bước 5: Test Database Connection

### Tạo file test (tùy chọn):

Tạo file `test-db.js` trong root:

```javascript
import mongoose from "mongoose";

const DATABASE_URL = process.env.DATABASE_URL || "mongodb://localhost:27017/siftly";

async function testConnection() {
  try {
    await mongoose.connect(DATABASE_URL);
    console.log("✅ MongoDB connected successfully!");
    
    // List databases
    const admin = mongoose.connection.db.admin();
    const dbs = await admin.listDatabases();
    console.log("📊 Available databases:", dbs.databases.map(db => db.name));
    
    await mongoose.disconnect();
    console.log("✅ Disconnected from MongoDB");
    process.exit(0);
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
}

testConnection();
```

Chạy test:
```bash
node test-db.js
```

---

## Bước 6: Verify Collections

Sau khi chạy ứng dụng và submit form Contact Us, các collections sẽ được tạo tự động:

1. **Kiểm tra bằng MongoDB Compass** (GUI tool):
   - Download: https://www.mongodb.com/try/download/compass
   - Connect với connection string của bạn
   - Xem collections: `users` và `contacts`

2. **Kiểm tra bằng MongoDB Shell** (mongo/mongosh):
   ```bash
   # Kết nối
   mongosh "mongodb://localhost:27017/siftly"
   # hoặc
   mongosh "mongodb+srv://siftly_user:password@cluster0.xxxxx.mongodb.net/siftly"
   
   # List databases
   show dbs
   
   # Use database
   use siftly
   
   # List collections
   show collections
   
   # Xem documents trong collection contacts
   db.contacts.find().pretty()
   ```

---

## Troubleshooting

### Lỗi: "DATABASE_URL environment variable is not set"

**Nguyên nhân:** Environment variable chưa được set

**Giải pháp:**
- Tạo file `.env` với DATABASE_URL
- Hoặc set environment variable trong terminal
- Hoặc thêm vào Replit Secrets

### Lỗi: "MongoServerError: Authentication failed"

**Nguyên nhân:** Username hoặc password sai

**Giải pháp:**
- Kiểm tra lại username và password trong connection string
- Đảm bảo đã thay `<username>` và `<password>` trong connection string
- Tạo lại database user trong MongoDB Atlas nếu cần

### Lỗi: "MongoNetworkError: connect ECONNREFUSED"

**Nguyên nhân:** Không thể kết nối đến MongoDB server

**Giải pháp:**
- **Nếu dùng local:** Kiểm tra MongoDB service đang chạy
  - Windows: Services → MongoDB
  - macOS: `brew services list`
  - Linux: `sudo systemctl status mongod`
- **Nếu dùng Atlas:** Kiểm tra IP đã được whitelist trong Network Access

### Lỗi: "MongoServerError: IP not whitelisted"

**Nguyên nhân:** IP address chưa được whitelist trong MongoDB Atlas

**Giải pháp:**
- Vào MongoDB Atlas → Network Access
- Click "Add IP Address"
- Chọn "Allow Access from Anywhere" (0.0.0.0/0) hoặc thêm IP cụ thể

### Lỗi: "Cannot find module 'mongoose'"

**Nguyên nhân:** Package chưa được cài đặt

**Giải pháp:**
```bash
npm install mongoose @types/mongoose
```

---

## Cấu trúc Database

### Database: `siftly`

#### Collection: `users`
```javascript
{
  _id: ObjectId,
  username: String (unique, required),
  password: String (required),
  createdAt: Date,
  updatedAt: Date
}
```

#### Collection: `contacts`
```javascript
{
  _id: ObjectId,
  fullName: String (required),
  email: String (required),
  company: String (optional),
  message: String (required),
  newsletter: Boolean (default: false),
  createdAt: Date,
  updatedAt: Date
}
```

---

## Lưu ý Bảo mật

1. **Không commit file `.env`** vào Git
   - File `.env` đã có trong `.gitignore`
   - Không chia sẻ connection string công khai

2. **Bảo vệ Database Credentials:**
   - Sử dụng strong password cho database user
   - Không hardcode credentials trong code
   - Sử dụng environment variables

3. **Network Security:**
   - Chỉ whitelist IP cần thiết (không dùng 0.0.0.0/0 trong production)
   - Sử dụng VPN hoặc private network khi có thể

4. **Backup:**
   - Backup database định kỳ
   - MongoDB Atlas tự động backup (trong paid plans)
   - Export data thủ công nếu cần

---

## Tài liệu Tham khảo

- [MongoDB Installation Guide](https://docs.mongodb.com/manual/installation/)
- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [MongoDB Atlas Setup](https://docs.atlas.mongodb.com/getting-started/)
- [MongoDB Connection Strings](https://docs.mongodb.com/manual/reference/connection-string/)

---

## Checklist Setup

- [ ] MongoDB đã được cài đặt (Atlas hoặc Local)
- [ ] Database user đã được tạo (nếu dùng Atlas)
- [ ] IP đã được whitelist (nếu dùng Atlas)
- [ ] Connection string đã được lấy
- [ ] DATABASE_URL đã được set (file .env hoặc environment variable)
- [ ] Dependencies đã được cài đặt (`npm install`)
- [ ] Server chạy thành công (`npm run dev`)
- [ ] Log hiển thị "MongoDB connected successfully"
- [ ] Test submit form Contact Us thành công
- [ ] Collections đã được tạo trong database

---

**Chúc bạn setup thành công! 🎉**
