# Tích Hợp Human Handoff vào ChatWidget

## ✅ Đã Hoàn Thành

### 1. Cập Nhật Interface
- Thêm `requiresHuman` vào `Message` interface
- Thêm các state mới để quản lý handoff flow

### 2. Phát Hiện Handoff
- Tự động phát hiện khi `requiresHuman: true` trong response
- Lưu thông tin handoff (sessionId, reason, confidence)

### 3. Form Thu Thập Thông Tin
- Form hiển thị khi cần handoff
- Thu thập tên và email người dùng
- Validation email format
- UI/UX thân thiện với animations

### 4. Tạo Ticket
- Gọi API `/api/chat/handoff` khi người dùng submit form
- Hiển thị loading state khi đang tạo ticket
- Xử lý lỗi và hiển thị thông báo phù hợp

### 5. Thông Báo Kết Quả
- Hiển thị ticket number khi tạo thành công
- Thêm message vào chat với thông tin ticket
- Xử lý lỗi với thông báo rõ ràng

## 🎨 Tính Năng UI

### Form Handoff
- **Vị trí**: Hiển thị ở cuối chat widget, trước input box
- **Màu sắc**: Blue theme để nổi bật
- **Validation**: 
  - Kiểm tra email format
  - Yêu cầu cả tên và email
- **Buttons**:
  - "Tạo ticket hỗ trợ" - Primary action
  - "Bỏ qua" - Secondary action

### Visual Indicators
- Badge "Cần hỗ trợ từ nhân viên" trên message khi `requiresHuman: true`
- Loading spinner khi đang tạo ticket
- Success/Error messages rõ ràng

## 🧪 Cách Test

### 1. Test với Confidence Thấp
```
1. Mở chat widget
2. Gửi câu hỏi không liên quan đến Siftly (ví dụ: "What is the weather?")
3. Khi confidence < 60%, form handoff sẽ xuất hiện
4. Điền tên và email
5. Click "Tạo ticket hỗ trợ"
6. Kiểm tra ticket được tạo trong Zoho Desk
```

### 2. Test với Từ Khóa Handoff
```
1. Gửi message: "Tôi muốn nói chuyện với nhân viên"
2. Form handoff sẽ xuất hiện ngay lập tức
3. Điền thông tin và tạo ticket
```

### 3. Test Validation
```
1. Trigger handoff
2. Thử submit với email không hợp lệ (ví dụ: "test@")
3. Kiểm tra error message hiển thị
4. Thử submit với email hợp lệ
5. Kiểm tra ticket được tạo
```

### 4. Test Error Handling
```
1. Tạm thời tắt chat-bot server
2. Trigger handoff và submit form
3. Kiểm tra error message hiển thị đúng
```

## 🔧 Cấu Hình

### API Endpoint
Mặc định: `http://localhost:3000/api/chat/handoff`

Nếu chat-bot chạy trên port khác, cập nhật trong `ChatWidget.tsx`:
```typescript
const response = await fetch('http://localhost:YOUR_PORT/api/chat/handoff', {
  // ...
});
```

### Environment Variables
Đảm bảo chat-bot server có các biến môi trường:
- `ZOHO_REFRESH_TOKEN`
- `ZOHO_CLIENT_ID`
- `ZOHO_CLIENT_SECRET`
- `ZOHO_ORG_ID`
- `ZOHO_DEPARTMENT_ID`

### Realtime (hiển thị reply của nhân viên ngay trên web)

1) **Tạo bảng realtime**: chạy file `chat-bot/setup-realtime.sql` trong Supabase SQL Editor.

2) **Cấu hình frontend (Vite)**: tạo `.env` (hoặc `.env.local`) ở **root project** với:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

3) **Cấu hình server webhook (Next.js chat-bot)**: trong `chat-bot/.env.local` thêm:

```env
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
ZOHO_WEBHOOK_SECRET=your-random-secret-string
```

4) **Zoho Desk Webhook**: trỏ webhook về endpoint:
- `POST /api/zoho/webhook`
- Header: `X-Zoho-Webhook-Secret: <ZOHO_WEBHOOK_SECRET>`

Khi nhân viên trả lời trong Zoho Desk, webhook sẽ ghi message vào `handoff_messages` → Supabase Realtime push → ChatWidget tự hiện ngay (không reload).

## 📝 Code Structure

### State Management
```typescript
- userName, userEmail: Thông tin người dùng
- showHandoffForm: Hiển thị/ẩn form handoff
- pendingHandoff: Thông tin handoff đang chờ xử lý
- handoffStatus: Trạng thái tạo ticket (success/error)
- isCreatingTicket: Loading state
```

### Key Functions
- `handleCreateHandoffTicket()`: Tạo ticket trong Zoho Desk
- `validateEmail()`: Validate email format
- `handleSkipHandoff()`: Bỏ qua handoff

## 🚀 Next Steps

1. **Thu thập thông tin sớm**: Có thể thêm form đăng ký khi bắt đầu chat
2. **Lưu thông tin**: Lưu userName và userEmail vào localStorage để tái sử dụng
3. **Cải thiện UX**: 
   - Auto-fill thông tin nếu đã có
   - Remember user preferences
   - Better error messages
4. **Analytics**: Track handoff events để phân tích

## 🐛 Troubleshooting

### Form không hiển thị
- Kiểm tra `requiresHuman: true` trong API response
- Kiểm tra console logs
- Đảm bảo `sessionId` được set

### Ticket không được tạo
- Kiểm tra network tab trong DevTools
- Kiểm tra API response
- Kiểm tra Zoho credentials trong chat-bot server
- Xem logs trong chat-bot server console

### Email validation không hoạt động
- Kiểm tra `validateEmail()` function
- Test với các format email khác nhau

---

**Tích hợp hoàn tất! 🎉**

