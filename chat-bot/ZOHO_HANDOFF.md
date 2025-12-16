# Hướng Dẫn Tích Hợp Human Handoff với Zoho Desk

## Tổng Quan

Tính năng Human Handoff tự động chuyển giao cuộc trò chuyện từ chatbot sang nhân viên CSKH trong Zoho Desk khi:

1. **Độ tin cậy thấp**: Confidence score < 60%
2. **Người dùng yêu cầu**: Câu hỏi chứa từ khóa như:
   - "nói chuyện với người"
   - "nói chuyện với nhân viên"
   - "gặp nhân viên"
   - "human", "agent", "support agent"
   - "speak to someone", "talk to human"
   - "kết nối với", "chuyển cho"

## Quy Trình Handoff

### Bước 1: Phát Hiện Trigger

Khi chatbot nhận được câu hỏi:
- RAG pipeline tính toán confidence score
- Kiểm tra từ khóa handoff trong câu hỏi
- Nếu confidence < 60% HOẶC có từ khóa → Trigger handoff

### Bước 2: Thu Thập Thông Tin

Hệ thống tự động thu thập:
- **Thông tin người dùng**: Tên, email (nếu có)
- **Lý do handoff**: "Low Confidence - 52%" hoặc "User requested human"
- **Lịch sử chat**: 5-10 tin nhắn cuối cùng

### Bước 3: Tạo Ticket trong Zoho Desk

API `/api/chat/handoff` sẽ:
1. Kiểm tra xem đã có ticket cho session này chưa
2. Cập nhật thông tin người dùng vào session
3. Lấy lịch sử chat
4. Tạo ticket trong Zoho Desk với đầy đủ context

## API Endpoints

### POST `/api/chat/handoff`

Tạo ticket handoff trong Zoho Desk.

**Request Body:**
```json
{
  "sessionId": "uuid-of-session",
  "userName": "Nguyễn Văn A", // Optional
  "userEmail": "user@example.com", // Optional
  "handoffReason": "Low Confidence - 52%" // Optional, tự động detect nếu không có
}
```

**Response:**
```json
{
  "success": true,
  "ticketId": "123456789",
  "ticketNumber": "TKT-001",
  "message": "Ticket created successfully in Zoho Desk"
}
```

**Nếu ticket đã tồn tại:**
```json
{
  "success": true,
  "ticketId": "123456789",
  "message": "Ticket already exists for this session",
  "alreadyExists": true
}
```

### POST `/api/chat`

API chat thông thường, hỗ trợ thêm tham số:

**Request Body:**
```json
{
  "message": "Câu hỏi của người dùng",
  "sessionId": "uuid-of-session", // Optional
  "userId": "user-id", // Optional
  "userName": "Nguyễn Văn A", // Optional - thu thập thông tin người dùng
  "userEmail": "user@example.com" // Optional - thu thập thông tin người dùng
}
```

## Cấu Hình Zoho Desk

Xem chi tiết trong [ENV_SETUP.md](./ENV_SETUP.md#4-zoho-desk-api-credentials)

### Biến Môi Trường Cần Thiết:

```env
ZOHO_ACCOUNTS_URL=https://accounts.zoho.com
ZOHO_DESK_API_URL=https://desk.zoho.com/api/v1
ZOHO_ORG_ID=your-org-id
ZOHO_CLIENT_ID=your-client-id
ZOHO_CLIENT_SECRET=your-client-secret
ZOHO_REFRESH_TOKEN=your-refresh-token
```

## Quản Lý OAuth Tokens

### Tự Động Refresh Token

Hệ thống tự động quản lý OAuth tokens:
- Access Token có hiệu lực 1 giờ
- Tự động refresh khi token hết hạn
- Lưu trữ an toàn trong database
- Sử dụng Refresh Token để lấy Access Token mới

### Lưu Trữ Tokens

Tokens được lưu trong bảng `zoho_tokens`:
- `access_token`: Token hiện tại (tự động refresh)
- `refresh_token`: Token để refresh (từ environment variable)
- `expires_at`: Thời gian hết hạn

⚠️ **Lưu ý**: Trong production, nên mã hóa tokens trước khi lưu vào database.

## Cấu Trúc Database

### Bảng `chat_sessions` (đã cập nhật)
- `user_name`: Tên người dùng
- `user_email`: Email người dùng

### Bảng `zoho_tokens` (mới)
- Lưu trữ OAuth tokens
- Tự động refresh khi cần

### Bảng `zoho_tickets` (mới)
- Theo dõi các ticket đã tạo
- Liên kết với `chat_sessions`

## Ví Dụ Sử Dụng

### Frontend Integration

```typescript
// Khi chatbot trả về requiresHuman: true
if (response.requiresHuman) {
  // Thu thập thông tin người dùng
  const userName = prompt("Vui lòng nhập tên của bạn:");
  const userEmail = prompt("Vui lòng nhập email của bạn:");
  
  // Gọi API handoff
  const handoffResponse = await fetch('/api/chat/handoff', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: currentSessionId,
      userName,
      userEmail,
      handoffReason: `Low Confidence - ${Math.round(response.confidence * 100)}%`
    })
  });
  
  const result = await handoffResponse.json();
  if (result.success) {
    alert(`Ticket đã được tạo: ${result.ticketNumber}`);
  }
}
```

## Troubleshooting

### Lỗi: "Zoho refresh token is not configured"
→ Kiểm tra `ZOHO_REFRESH_TOKEN` trong `.env.local`

### Lỗi: "Failed to refresh Zoho token"
→ Kiểm tra:
- Refresh token có còn hợp lệ không
- Client ID và Secret có đúng không
- Zoho API có đang hoạt động không

### Lỗi: "Failed to create Zoho ticket"
→ Kiểm tra:
- Organization ID có đúng không
- Access token có hợp lệ không
- Quyền API có đủ không (Desk.tickets.CREATE)

### Ticket không được tạo
→ Kiểm tra:
- Logs trong console để xem chi tiết lỗi
- Zoho Desk API có đang hoạt động không
- Email trong ticket data có hợp lệ không (Zoho yêu cầu email)

## Best Practices

1. **Thu thập thông tin sớm**: Hỏi tên và email người dùng ngay từ đầu chat
2. **Xử lý lỗi gracefully**: Nếu không tạo được ticket, vẫn thông báo cho người dùng
3. **Theo dõi tickets**: Sử dụng bảng `zoho_tickets` để theo dõi các handoff
4. **Bảo mật tokens**: Trong production, mã hóa tokens trước khi lưu
5. **Test thường xuyên**: Kiểm tra refresh token mechanism định kỳ

## Security Notes

⚠️ **QUAN TRỌNG**:
- **KHÔNG** commit refresh token vào Git
- **KHÔNG** log access tokens
- Mã hóa tokens trong production
- Sử dụng HTTPS cho tất cả API calls
- Giới hạn quyền API chỉ những gì cần thiết

