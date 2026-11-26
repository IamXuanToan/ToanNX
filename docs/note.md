Còn số cái phát sinh như sau:
1. Khi ấn vào thông báo phải đá về trang client. Ví dụ khi tiền về
2. Nên tảng cho cấu hình màu và nó mapping với chart để hiển thị màu đúng. Xem màu chuẩn light dark nhé
3. xem sửa lại dashboard của trang client
- Không chia ra tài chính ủng hộ kiểu thế. Có thể để chung vào 1 dashboard hết luôn
- Xem webhook từ mỗi qr có tự động apply vào tài chính không để khi nó nhận thì tự hiểu luôn
- Seed thêm 1 nền tảng là donate để nó apply vào đó
4. Khi đăng nhập thì luôn vào client. Nếu admin thì tự thao tác sau

5.
Với hiện tại hệ thống có nhắc lịch thì check case xem nhắc lịch đó nên toàn bộ hệ thống được bao nhiêu cái nhắc lịch cron đồ á. Nếu lưu redis thì mỗi ngày cần truy vấn tránh việc redis chết giữa chừng. Cần check kĩ các cron module wordspace hiện tại

===============


# Bổ sung: Infrastructure Logging, Resource Monitoring & Automatic Log Cleanup

## 1. Mục tiêu

Triển khai hệ thống logging, resource monitoring và quota monitoring tập trung cho toàn bộ ToanNX.

Mục đích:

- Biết chính xác hệ thống đang gọi những dịch vụ nào.
- Biết mỗi dịch vụ được gọi bao nhiêu lần.
- Phát hiện request dư thừa, polling bất thường và retry liên tục.
- Phát hiện dịch vụ sắp vượt hạn mức Free Tier.
- Dễ dàng truy vết lỗi khi hệ thống gặp sự cố.
- Xác định module, endpoint hoặc tác vụ nào tiêu thụ nhiều tài nguyên nhất.
- Lưu lịch sử sử dụng tài nguyên theo ngày, tháng và năm.
- Tự động dọn dẹp log cũ.
- Không để chính hệ thống logging trở thành nguyên nhân vượt quota.

Đây là nhiệm vụ triển khai trực tiếp source code, không chỉ lập plan.

Đọc toàn bộ source code, docs/, báo cáo infrastructure-free-tier-audit, hệ thống logging, health check, Sentry và notification hiện tại trước khi thực hiện.

## 2. Kiến trúc logging

Thiết kế hệ thống logging tập trung, tái sử dụng logging framework hiện tại của Django và Next.js.

Yêu cầu:

- Structured logging.
- Phân loại log theo từng dịch vụ.
- Mỗi loại log có file riêng.
- Phân chia file theo ngày.
- Correlation ID và Request ID xuyên suốt request lifecycle.
- Hỗ trợ truy vết frontend → backend → database → external service.
- Phân biệt môi trường local, preview và production.
- Không sử dụng print hoặc console.log tùy tiện.
- Không ghi log trùng lặp giữa nhiều tầng.
- Không tạo framework logging quá phức tạp.

### Local Development

Lưu file log trong thư mục logs/ của project.

Thực hiện log rotation và cleanup tự động.

Không commit file log lên GitHub.

### Production — Vercel Serverless

Không sử dụng filesystem local làm nơi lưu trữ log lâu dài.

Filesystem Vercel không đảm bảo tồn tại giữa các invocation.

Nghiên cứu cơ chế phù hợp để lưu log lâu dài trên Cloudflare R2 private hiện có.

Ưu tiên:

- Structured stdout logs cho Vercel Runtime Logs.
- Lưu trữ log dài hạn theo batch.
- File log dạng immutable segments, không ghi đè object đồng thời.
- Nén gzip khi phù hợp.
- Phân loại từng dịch vụ.
- Giới hạn kích thước file.
- Không tạo một R2 PutObject cho mỗi dòng log.
- Không tạo background thread chạy sau response nếu runtime không đảm bảo thực thi.
- Không sử dụng bộ nhớ local làm nơi lưu trữ duy nhất của log quan trọng.
- Không mặc định sử dụng PostgreSQL để lưu toàn bộ log.
- Không sử dụng Redis cho mỗi dòng log nếu làm tăng số lượng command quá mức.

Phải đánh giá chi phí của các phương án vận chuyển, buffering và lưu trữ log trước khi chọn giải pháp.

Nếu không thể đảm bảo lưu toàn bộ log production với chi phí miễn phí hợp lý, phải phân biệt rõ log đầy đủ, log được sampling, log tổng hợp và log best-effort.

Không được báo cáo rằng log đã lưu thành công nếu thực tế chưa được lưu bền vững.

## 3. Phân loại file log

Tổ chức file theo dịch vụ, môi trường và ngày.

Cấu trúc logic đề xuất:

    logs/
      production/
        2026/
          11/
            26/
              application.log
              api-request.log
              frontend.log
              error.log
              security.log
              authentication.log
              neon.log
              redis.log
              qstash.log
              vercel.log
              cloudflare-r2.log
              cloudflare-worker.log
              cloudflare-kv.log
              cron.log
              workspace.log
              notification.log
              backup.log
              firebase.log
              telegram.log
              smtp.log
              sepay.log
              xkiro.log
              open-meteo.log
              oauth.log
              cache.log
              external-api.log
              quota.log
              cleanup.log
              resource-usage.json

Tự động bổ sung file riêng cho các dịch vụ khác phát hiện trong source code.

Đối với production R2, được phép lưu mỗi nhóm log thành nhiều segment độc lập theo ngày để tránh race condition và ghi đè dữ liệu.

Không cần tạo file rỗng nếu không có sự kiện.

## 4. Chuẩn hóa cấu trúc log

Mỗi log event cần có các trường phù hợp:

- Timestamp.
- Environment.
- Log level.
- Service name.
- Module.
- Operation.
- Event code.
- Request ID.
- Correlation ID.
- Trace ID nếu có.
- Endpoint hoặc route template.
- HTTP method.
- HTTP status.
- Duration milliseconds.
- Result.
- Error code.
- Error type.
- Error message đã được loại bỏ dữ liệu nhạy cảm.
- Retry attempt.
- Cache hit/miss.
- Fallback status.
- Resource consumption.
- Deployment version.
- Metadata cần thiết.

Ưu tiên JSON Lines để có thể đọc, tìm kiếm, thống kê và phân tích bằng công cụ tự động.

Stack trace chỉ lưu khi cần thiết, không lặp lại toàn bộ stack trace ở nhiều tầng.

Log phải sử dụng UTC timestamp. Khi hiển thị cho người quản trị, chuyển sang Asia/Ho_Chi_Minh.

## 5. Neon PostgreSQL Logging

Tạo logger riêng cho Neon/PostgreSQL.

File logic:

`neon.log`

Theo dõi:

- Database connection attempts.
- Connection success/failure.
- Connection timeout.
- Connection duration.
- SQL query count theo request.
- SQL execution duration.
- Slow queries.
- Transaction duration.
- Transaction rollback.
- Query timeout.
- Deadlock.
- Database exceptions.
- Database unavailable.
- Connection pool errors.
- Database fallback.
- Database backup.
- Migration execution.
- Module và endpoint tiêu thụ nhiều query.

Không ghi toàn bộ dữ liệu SQL parameters hoặc kết quả truy vấn.

Không ghi DATABASE_URL, database password hoặc connection string.

Không bật DEBUG=True trên production.

Không ghi từng SQL query thành một persistent log event mặc định. Ưu tiên tổng hợp query count và duration theo request.

Có thể lưu SQL fingerprint đã được chuẩn hóa cho slow query nếu đảm bảo không chứa dữ liệu nhạy cảm.

Ngưỡng slow query đề xuất:

- Warning: từ 500 milliseconds.
- Error hoặc critical performance event: từ 2.000 milliseconds, tùy loại query.

Các ngưỡng phải được tập trung trong constants hoặc settings hiện có.

Không thực hiện thêm SQL query chỉ để tạo log.

Không ping database liên tục chỉ để kiểm tra compute usage.

Không làm Neon mất khả năng Scale-to-Zero.

Phân biệt rõ application-side database metrics và official Neon provider metrics.

Không quy đổi trực tiếp số SQL query thành CU-hours.

## 6. Upstash Redis Logging

Tạo file:

`redis.log`

Theo dõi:

- Redis command count.
- Command type.
- GET.
- SET.
- DELETE.
- INCR.
- EXPIRE.
- MGET.
- Pipeline.
- Cache hit.
- Cache miss.
- Connection failure.
- Timeout.
- Retry.
- Redis unavailable.
- PostgreSQL fallback.
- Distributed lock success/failure.
- Rate limit triggered.
- Key expiration.
- Namespace invalidation.
- Redis command duration.
- Module tiêu thụ nhiều Redis commands.

Không ghi giá trị cache, session token hoặc nội dung Redis key chứa thông tin nhạy cảm.

Tổng hợp số Redis commands theo request, module và operation.

Không tạo thêm Redis INCR cho mỗi Redis command chỉ để đếm số Redis commands.

Không sử dụng chính Redis một cách đệ quy để ghi log lỗi Redis.

Nếu Redis bị lỗi, logging vẫn phải hoạt động mà không kích hoạt vòng lặp fallback vô hạn.

Thống kê:

- Redis commands theo ngày.
- Redis commands theo tháng.
- Cache hit rate.
- Cache miss rate.
- Commands theo module.
- Fallback PostgreSQL count.
- Timeout rate.
- Dự báo vượt quota.

## 7. Upstash QStash Logging

Tạo file:

`qstash.log`

Theo dõi:

- Publish message.
- Publish success/failure.
- Scheduled delivery.
- Message delay.
- Callback execution.
- Message ID.
- Duplicate messages.
- Retry attempt.
- Retry exhausted.
- Signature verification failure.
- Callback duration.
- QStash unavailable.
- Fallback cron execution.
- Notification dispatch.
- Workspace dispatch-due.
- AI background processing.
- Message consumption theo ngày.

Phân biệt rõ publish request, delivery attempt và retry theo cách tính quota của provider.

Không ghi QStash token, signing key hoặc payload nhạy cảm.

Phát hiện:

- Message được publish lặp lại.
- Chuỗi scheduled messages không có điểm dừng.
- Message retry liên tục.
- Cùng một công việc được cron và QStash kích hoạt trùng lặp.
- Số message tăng bất thường.

## 8. Vercel Logging

Tạo file logic:

`vercel.log`

Theo dõi các thông tin application có thể đo được:

- Frontend server requests.
- Backend invocations quan sát được từ ứng dụng.
- Request duration.
- HTTP status.
- Function errors.
- Function timeout.
- Cold start indicator nếu xác định được.
- Deployment version.
- Environment.
- Region.
- SSR requests.
- API requests.
- Image Optimization requests nếu có nguồn dữ liệu phù hợp.
- Cron invocations.

Nếu có official Vercel Usage API phù hợp gói Free và quyền truy cập hiện tại, tích hợp theo tần suất thấp.

Không tự coi wall-clock request duration là Active CPU.

Không tự coi application request count là toàn bộ Vercel billable invocations.

Nếu không có API chính thức để lấy một metric, đánh dấu UNKNOWN hoặc MANUAL_DASHBOARD.

Không gọi API nội bộ không được hỗ trợ của Vercel.

## 9. Cloudflare R2 Logging

Tạo file:

`cloudflare-r2.log`

Theo dõi:

- Upload.
- Download nếu ứng dụng có thể quan sát.
- Delete.
- ListObjects.
- HeadObject.
- CopyObject.
- Signed URL generation.
- Object storage errors.
- Upload duration.
- Download duration.
- File size.
- Class A operations.
- Class B operations.
- Storage usage.
- Public/private bucket.
- Orphan cleanup.
- Usage API requests.
- Usage cache hit/miss.
- Quota check.
- Quota exceeded.

Phân biệt số operation quan sát từ backend và số operation thực tế trên Cloudflare, vì browser có thể truy cập R2/CDN trực tiếp.

Không ghi signed URL đầy đủ, access key, secret key hoặc nội dung file.

Các hoạt động ghi log lên R2 cũng phải được tính vào ngân sách tài nguyên.

Không tạo log đệ quy khi chính log storage sử dụng R2.

## 10. Logging tất cả dịch vụ bên ngoài

Triển khai logger riêng cho tất cả dịch vụ đang thực sự sử dụng, bao gồm:

### Firebase

- Push token registration.
- Push delivery.
- Delivery success/failure.
- Invalid device token.
- Retry.
- Firebase API error.

### Telegram

- Webhook.
- Message delivery.
- Duplicate updates.
- AI command execution.
- Rate limit.
- Telegram API error.

### SMTP

- Email delivery.
- Connection duration.
- Success/failure.
- Retry.
- Timeout.

### SePay

- Webhook received.
- Signature verification result.
- Duplicate transaction.
- Transaction classification.
- Import API request.
- Pagination.
- Rate limit.
- Processing result.

Không lưu nội dung giao dịch ngân hàng đầy đủ vào log.

### xKiro AI

- Model sử dụng.
- Request count.
- Response duration.
- Token usage nếu API cung cấp.
- Model fallback.
- Retry.
- Rate limit.
- Quota exceeded.
- Provider unavailable.
- Tool call count.

Không lưu nội dung hội thoại, system prompt hoặc dữ liệu nghiệp vụ nhạy cảm mặc định.

### Open-Meteo, OAuth và các external API khác

- Request count.
- Cache hit/miss.
- Timeout.
- Retry.
- HTTP status.
- Response duration.
- Quota hoặc rate limit.
- Module sử dụng.

Các request chạy trực tiếp trên trình duyệt chỉ được thống kê bằng dữ liệu frontend hoặc nguồn metrics phù hợp.

Không tạo một backend telemetry request cho mỗi external API call trên frontend.

## 11. API Request và Error Logging

Tạo các file riêng:

- api-request.log
- frontend.log
- application.log
- error.log
- security.log
- authentication.log

Theo dõi:

- Tổng số API requests.
- Requests theo module.
- Requests theo endpoint.
- Requests theo HTTP status.
- Requests theo environment.
- Response duration.
- Slow endpoints.
- Error rate.
- Authentication failures.
- Permission denied.
- Rate limit.
- Token refresh.
- Duplicate requests.
- Request timeout.
- External dependency failure.

Không ghi toàn bộ request body và response body mặc định.

Đảm bảo có thể dùng Request ID để tìm những log liên quan trong nhiều file.

Tích hợp với Sentry hiện có.

Không gửi toàn bộ INFO logs lên Sentry.

Không gửi cùng một exception nhiều lần.

## 12. Cron và Background Job Logging

Tạo file:

`cron.log`

Mỗi lần cron chạy cần có:

- Job name.
- Job ID.
- Trigger source.
- Scheduled time nếu xác định được.
- Actual start time.
- End time.
- Duration.
- Success/failure.
- Skipped status.
- Skip reason.
- Number of processed records.
- Number of failed records.
- Database query count.
- Redis commands.
- External API calls.
- Retry count.
- Distributed lock status.
- Next scheduled run.

Thống kê riêng:

- Health check.
- Daily cleanup.
- Notification dispatch.
- Workspace tick.
- Workspace dispatch-due.
- QStash background jobs.
- Database backup.
- Log cleanup.
- Resource usage aggregation.

Phát hiện cron:

- Chạy sai tần suất.
- Chạy trùng lặp.
- Chạy quá thời gian dự kiến.
- Thất bại liên tiếp.
- Không xử lý công việc nhưng vẫn tiêu thụ nhiều tài nguyên.
- Đánh thức database không cần thiết.

Các cron chạy ngoài project như Cloudflare Worker, cron-job.org và GitHub Actions không được coi là đã có đầy đủ log nếu chưa tích hợp hoặc lấy dữ liệu từ nguồn tương ứng.

Cung cấp hướng dẫn bổ sung logging cho các script bên ngoài nếu cần.

## 13. Resource Usage Monitoring

Tạo hệ thống tổng hợp mức sử dụng tài nguyên theo:

- Ngày.
- Tháng.
- Năm.
- Module.
- Provider.
- Operation.
- Environment.

Mỗi ngày tạo một bản resource usage summary dạng JSON.

Thống kê tối thiểu:

| Provider | Metric |
|---|---|
| Neon | Query count, query duration, connection errors, CU-hours nếu lấy được từ provider |
| Redis | Commands, cache hit/miss, fallback count |
| QStash | Messages, deliveries, retries |
| Vercel | Observed requests, invocations, errors, CPU/memory nếu lấy được từ provider |
| R2 | Storage usage, Class A/B operations |
| Cloudflare Worker | Invocations nếu có metrics |
| Cloudflare KV | Reads, writes nếu có metrics |
| GitHub Actions | Workflow duration, runner minutes nếu có |
| Firebase | Sent messages, failures |
| Telegram | API requests, messages |
| SMTP | Emails sent, failures |
| SePay | Webhooks, API requests |
| xKiro AI | Requests, tokens, retries |
| Sentry | Error events nếu có metrics |
| Umami | Events nếu có metrics |

Phân biệt:

- PROVIDER_VERIFIED: dữ liệu chính thức từ provider.
- APP_OBSERVED: dữ liệu ứng dụng trực tiếp quan sát.
- CALCULATED: tính toán từ dữ liệu xác minh.
- ESTIMATED: ước tính.
- UNKNOWN: chưa có dữ liệu.
- MANUAL_DASHBOARD: cần đối chiếu thủ công.

Không trộn dữ liệu ước tính và dữ liệu billing thực tế.

Hiển thị thời điểm cập nhật gần nhất của từng metric.

Không gọi provider API liên tục chỉ để lấy usage.

Ưu tiên đồng bộ usage một lần mỗi ngày nếu provider hỗ trợ.

## 14. Quota Monitoring và cảnh báo

Tạo file:

`quota.log`

Thiết kế quota registry tập trung, chứa:

- Provider.
- Resource name.
- Free limit.
- Unit.
- Reset period.
- Billing cycle.
- Current usage.
- Remaining quota.
- Usage percentage.
- Estimated daily consumption.
- Estimated end-of-cycle usage.
- Last updated.
- Data source.
- Confidence.
- Official documentation reference.

Không hard-code các hạn mức rải rác trong source.

Đối chiếu với tài liệu chính thức hiện hành trước khi thiết lập quota.

Ngưỡng cảnh báo đề xuất:

- 50%: ghi nhận thông tin.
- 70%: cảnh báo sớm.
- 80%: cảnh báo ưu tiên cao.
- 90%: cảnh báo nghiêm trọng.
- 100%: quota exceeded.

Phát hiện cả trường hợp usage hiện tại chưa cao nhưng tốc độ sử dụng dự kiến vượt quota trước khi reset.

Khi vượt ngưỡng:

- Ghi quota.log.
- Gửi thông báo qua hệ thống notification hiện tại.
- Ưu tiên Telegram với các lỗi nghiêm trọng.
- Không gửi lại cùng một cảnh báo liên tục.
- Có deduplication theo provider, metric, threshold và billing cycle.
- Có recovery notification khi thực sự cần thiết.

Không tự động chặn các chức năng nghiệp vụ quan trọng khi chạm ngưỡng cảnh báo.

Chỉ giảm hoặc tạm ngừng các tác vụ không quan trọng nếu đã có chính sách rõ ràng và an toàn.

## 15. Dashboard quản trị log và tài nguyên

Kiểm tra module System, Health và Monitoring hiện có.

Tái sử dụng giao diện quản trị hiện tại, không tạo module mới nếu không cần thiết.

Bổ sung màn hình theo dõi:

### Resource Usage

- Danh sách provider.
- Current usage.
- Free quota.
- Remaining quota.
- Usage percentage.
- Ngưỡng cảnh báo.
- Dự báo cuối tháng.
- Biểu đồ usage theo ngày.
- Biểu đồ usage theo tháng.
- Thời điểm cập nhật gần nhất.
- Nguồn dữ liệu và độ chính xác.

### Logs

- Danh sách loại log.
- Lọc theo provider.
- Lọc theo ngày.
- Lọc theo log level.
- Lọc theo module.
- Lọc theo Request ID.
- Tìm kiếm error code.
- Xem nội dung log.
- Tải file log.
- Pagination.
- Hiển thị log mới nhất.
- Hiển thị kích thước file.
- Hiển thị retention policy.

### Cron Monitoring

- Danh sách cron.
- Lần chạy gần nhất.
- Trạng thái.
- Thời gian thực hiện.
- Số lần thất bại.
- Số resource operations tiêu thụ.

### Resource Analysis

- Module tiêu thụ nhiều database queries nhất.
- Endpoint tiêu thụ nhiều Redis commands nhất.
- Endpoint có thời gian xử lý cao nhất.
- Cron tiêu thụ nhiều tài nguyên nhất.
- Provider có nhiều lỗi nhất.
- Retry count.
- Cache hit rate.
- Top resource consumers.

Dashboard không được polling liên tục.

Ưu tiên dữ liệu snapshot đã tổng hợp, cache hợp lý và có nút Refresh thủ công.

Tuân thủ permission ba lớp menu, page và action theo kiến trúc hiện tại.

Không cho public access vào log.

## 16. Automatic Log Cleanup

Triển khai LogCleanupService hoặc tên tương đương theo convention hiện tại của project.

Tích hợp vào daily cleanup cron hiện có:

`GET /api/v1/system/health/cleanup`

Schedule:

`0 3 * * *`

Không tạo thêm cron-job.org job hoặc Vercel Cron riêng nếu có thể tái sử dụng cron hiện tại.

Cleanup phải chạy mỗi ngày một lần.

Retention policy mặc định:

| Loại dữ liệu | Retention |
|---|---:|
| API request logs | 7 ngày |
| Neon detailed logs | 7 ngày |
| Redis detailed logs | 7 ngày |
| Cache logs | 7 ngày |
| External API logs | 7 ngày |
| Application logs | 14 ngày |
| QStash logs | 14 ngày |
| Cron logs | 14 ngày |
| Notification logs | 14 ngày |
| Error logs | 30 ngày |
| Authentication logs | 30 ngày |
| Security logs | 30 ngày |
| Backup logs | 30 ngày |
| Quota warnings | 90 ngày |
| Daily resource usage summaries | 365 ngày |

Tạo chính sách retention riêng theo từng loại log.

Các log chưa được liệt kê phải có default retention hợp lý.

Cleanup cần:

- Chỉ xóa file đã hết hạn.
- Chỉ thao tác trong namespace hoặc prefix dành riêng cho logging.
- Không xóa attachment, backup database hoặc dữ liệu nghiệp vụ.
- Không xóa file đang được ghi.
- Hỗ trợ pagination.
- Giới hạn số file xử lý mỗi lượt.
- Giới hạn thời gian thực thi.
- Có distributed lock hoặc cơ chế chống chạy đồng thời phù hợp.
- Có idempotency.
- Hỗ trợ dry-run.
- Hỗ trợ retry an toàn.
- Ghi nhận số file đã xóa.
- Ghi nhận dung lượng đã giải phóng.
- Ghi nhận thời gian thực hiện.
- Ghi nhận số file lỗi.
- Không làm gián đoạn các cleanup task hiện tại.

Sử dụng R2 Lifecycle Rules làm cơ chế dự phòng nếu phù hợp.

Nếu sử dụng lifecycle theo loại log thì tổ chức object prefix tương ứng để có thể áp dụng retention độc lập.

Không tự động thay đổi cấu hình lifecycle production khi chưa được phép.

## 17. Giới hạn tài nguyên của chính Logging System

Đây là yêu cầu đặc biệt quan trọng.

Logging phải tiết kiệm tài nguyên và không ảnh hưởng đáng kể đến Free Tier.

Ngân sách mục tiêu ban đầu:

- Persistent log storage tối đa: 500 MB.
- Ưu tiên giữ mức sử dụng dưới 250 MB.
- Redis commands dành riêng cho logging: tối đa 5% quota tháng.
- R2 operations dành riêng cho logging: tối đa 1% quota tháng.
- Không thêm database queries cho health check.
- Không tạo thêm cron invocation định kỳ ngoài cron hiện có nếu không cần thiết.
- Không làm tăng đáng kể request latency.
- Không đánh thức Neon chỉ để lưu hoặc đọc log.

Các con số trên là ngân sách mục tiêu đề xuất, phải xác minh tính khả thi sau khi đọc source.

Khi lượng log tăng bất thường:

- Ưu tiên giữ ERROR, CRITICAL và security events.
- Giảm DEBUG logs.
- Sampling các INFO events lặp lại nếu cần.
- Tổng hợp các sự kiện giống nhau theo cửa sổ thời gian.
- Giới hạn kích thước từng event.
- Giới hạn stack trace.
- Giới hạn retry.
- Giới hạn file size.
- Không âm thầm xóa log lỗi quan trọng.
- Ghi nhận số log bị sampling hoặc dropped.

Tách việc đếm metric với việc lưu detailed log để sampling không làm sai lệch thống kê nếu hệ thống có khả năng duy trì bộ đếm chính xác.

Nếu logging bị lỗi, không được làm request nghiệp vụ thất bại chỉ vì không thể ghi log, trừ trường hợp audit nghiệp vụ có yêu cầu bắt buộc khác.

Không tạo vòng lặp logging khi logger hoặc storage gặp lỗi.

## 18. Bảo mật log

Tuyệt đối không lưu:

- Password.
- Access token.
- Refresh token.
- JWT đầy đủ.
- API key.
- OAuth client secret.
- Database connection string.
- Redis connection string.
- Authorization header.
- Cookie.
- CSRF token.
- Telegram bot token.
- Firebase service account.
- QStash signing key.
- Signed URL.
- Thông tin tài khoản ngân hàng đầy đủ.
- Nội dung giao dịch tài chính nhạy cảm.
- Dữ liệu cá nhân không cần thiết.
- Toàn bộ request/response payload mặc định.

Triển khai centralized log sanitization và secret redaction trước khi ghi stdout hoặc lưu trữ.

Kiểm tra redaction trong cả nested metadata, URL query parameters, exception messages và stack trace.

Log storage phải private.

Download log phải kiểm tra permission và không trả đường dẫn public cố định.

Kiểm tra log injection, path traversal và quyền truy cập.

## 19. Kiểm thử bắt buộc

Viết test cho:

- Structured logging.
- Logger routing theo provider.
- Secret redaction.
- Request correlation.
- Database query metrics.
- Redis command metrics.
- Cache hit/miss statistics.
- QStash retry logging.
- External API failure logging.
- Quota threshold.
- Quota warning deduplication.
- Resource usage aggregation.
- Log rotation.
- Log compression.
- Log cleanup.
- Retention policy.
- Cleanup dry-run.
- Cleanup idempotency.
- Cleanup concurrent execution.
- R2 unavailable.
- Redis unavailable.
- Logging storage unavailable.
- Log storage full.
- Sampling và dropped-event counters.
- Permission checks.
- Không xóa nhầm file nghiệp vụ.
- Không tạo database queries không cần thiết.
- Không tạo recursive logging.
- Không làm health check đánh thức Neon.

Kiểm tra UI thực tế của màn hình Logs, Resource Usage và Cron Monitoring.

Chạy lint, typecheck, unit test, integration test và build theo quy tắc dự án.

## 20. Cập nhật tài liệu

Tạo hoặc cập nhật tài liệu:

- docs/architecture/logging.md
- docs/architecture/resource-monitoring.md
- docs/guides/log-management.md
- docs/guides/deployment.md
- docs/audit/infrastructure-free-tier-audit.md

Tên và vị trí file thực tế phải tuân thủ cấu trúc docs/ hiện có.

Tài liệu cần mô tả:

- Logging architecture.
- Log categories.
- File format.
- Log storage.
- Resource metrics.
- Quota registry.
- Retention policy.
- Cleanup mechanism.
- Security.
- Hướng dẫn debug.
- Hướng dẫn truy vết bằng Request ID.
- Hướng dẫn đối chiếu dashboard provider.
- Cấu hình production.
- Cấu hình local.
- Các giới hạn của cơ chế logging trên Vercel Serverless.

## 21. Báo cáo sau triển khai

Sau khi hoàn thành, cung cấp:

1. Kiến trúc logging đã triển khai.
2. Danh sách file source đã tạo và sửa.
3. Danh sách các loại log.
4. Vị trí lưu trữ thực tế.
5. Cơ chế flush và lưu log production.
6. Mức độ đảm bảo không mất log.
7. Retention policy.
8. Cơ chế cleanup.
9. Resource metrics thu thập được.
10. Các metric chưa thể thu thập.
11. Các provider cần cấu hình hoặc bổ sung quyền.
12. Ước tính dung lượng log mỗi ngày và tháng.
13. Redis commands phát sinh do logging.
14. R2 operations phát sinh do logging.
15. Vercel CPU/memory overhead.
16. Neon compute overhead.
17. Kết quả kiểm thử.
18. Các rủi ro còn tồn tại.
19. Hướng dẫn kiểm tra hệ thống sau deploy.

Lập bảng:

| Logging operation | Calls/day | Calls/month | Storage usage | Resource overhead | Free quota percentage |

Không được kết luận logging không tốn tài nguyên nếu chưa thực hiện tính toán.

## 22. Nguyên tắc cuối cùng

ToanNX là hệ thống cá nhân, chủ yếu chỉ có một người sử dụng.

Ưu tiên:

- Đơn giản.
- Tiết kiệm.
- Dễ debug.
- Dễ bảo trì.
- Dữ liệu có thể truy vết.
- Không vượt Free Tier.
- Không phát sinh phí ngoài dự kiến.

Tái sử dụng Django logging, CacheService, R2 Storage, Sentry, Health Module, Notification Module và daily cleanup cron hiện có.

Không tự ý bổ sung Elasticsearch, Loki, Grafana, Datadog hoặc dịch vụ logging trả phí.

Không lưu log dung lượng lớn trong Neon PostgreSQL.

Không biến logging thành một hệ thống phức tạp hơn ứng dụng chính.

Các thông số trong prompt là định hướng. Phải đọc source thực tế, xác minh tính khả thi, trực tiếp triển khai giải pháp phù hợp, kiểm thử đầy đủ và cập nhật tài liệu.

Không tự deploy production hoặc thay đổi cấu hình dashboard bên ngoài khi chưa được phép.