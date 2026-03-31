# Business Specification: QR-Home Generation System

## 1. Giới thiệu dự án

Hệ thống **QR-Home Generation** là một nền tảng quản lý Menu dịch vụ thông qua mã QR, được thiết kế đặc thù cho ngành Spa (ví dụ: Azure Luxury Spa). Hệ thống cho phép quản trị viên tạo và quản lý danh sách dịch vụ, theo dõi lưu lượng truy cập, trong khi khách hàng có thể dễ dàng tiếp cận menu và thông tin chỉ bằng cách quét mã QR tại phòng.

---

## 2. Các đối tượng người dùng

- **Khách hàng (Customer):** Người sử dụng dịch vụ tại Spa, truy cập hệ thống qua thiết bị di động cá nhân bằng cách quét mã QR.
- **Quản trị viên (Admin/Manager):** Nhân viên quản lý tại Spa, chịu trách nhiệm cập nhật dịch vụ, quản lý trạng thái hoạt động của QR và theo dõi hiệu quả kinh doanh.

---

## 3. Cấu trúc hệ thống

### 3.1. Trang Khách hàng (Customer Site - Mobile Responsive)

Giao diện tối ưu cho thiết bị di động, mang lại trải nghiệm sang trọng và thân thiện.

#### A. Header & Brand Identity

- **Hero Banner:** Hiển thị hình ảnh thương hiệu (Azure Luxury Spa).
- **Thông tin chào mừng:** Hiển thị tên Spa và thông tin vị trí cụ thể (ví dụ: "Phòng trị liệu 04 • Chào mừng quý khách").

#### C. Article slide

- **Article:** Hiện tại hiển thị hình ảnh 5 sản phẩm được xem nhiều nhất ( Sau này bổ sung trang để config article riêng).

#### B. Danh mục dịch vụ (Menu)

- **Tính năng tìm kiếm (Search):** Thanh tìm kiếm cho phép khách hàng tra cứu nhanh dịch vụ theo tên.
- **Điều hướng danh mục (Categories):** Bộ lọc dịch vụ theo nhóm như:
  - Tất cả (All)
  - Best Seller
  - New Service
  - Combo
  - Chăm sóc da (Skincare)
  - Massage
  - Trị liệu (Therapy)
- **Danh sách thẻ dịch vụ (Service Cards):** Mỗi thẻ bao gồm:
  - Ảnh minh họa chất lượng cao.
  - Tên dịch vụ (ví dụ: Azure Signature Treatment).
  - Mô tả ngắn (ví dụ: 90 phút trải nghiệm thư giãn cao cấp).
  - Nhãn trạng thái (Best seller, New service).
  - Giá tiền (USD).

---

### 3.2. Trang Quản trị (Admin Site - Desktop)

Hệ thống quản lý tập trung với các công cụ phân tích và điều khiển.

#### A. Dashboard (Trang tổng quan)

- **Biểu đồ lưu lượng (Traffic View):** Hiển thị thống kê số lượt truy cập (Traffic) theo 7 ngày gần nhất dưới dạng biểu đồ cột.
- **Thống kê nhanh:** Dịch vụ được xem nhiều nhất.

#### B. Quản lý mã QR (QR Code Management)

- **Trạng thái QR:** Hiển thị trạng thái hiện tại (Active/Paused).
- **Điều khiển:** Nút "Tạm dừng dịch vụ" (Pause Service) hoặc "Kích hoạt" (Resume) để kiểm soát việc quét mã khách hàng.
- **Tải xuống QR (Download QR):** Cho phép xuất mã QR dưới dạng ảnh để in ấn và dán tại các phòng.

### B.1 Quản lý mã QR (QR Code Management) (Khi chưa generate QR và chặn khi chưa có service)

- **Trạng thái QR:** Inactive
- **Điều khiển:** Generate QR nếu có service, nếu chưa có service thì chặn không cho generate QR.
- **Tải xuống QR (Download QR):** Chặn không cho tải xuống QR.

#### C. Quản lý danh mục & Dịch vụ (Service Management)

- **Danh sách dịch vụ:** Hiển thị bảng danh sách các dịch vụ đang có:
  - **Total service:** Tổng số dịch vụ.
  - **Service Views:** Tổng số lượt xem dịch vụ.
  - **Growth:** Tỷ lệ tăng trưởng lượt xem so với ngày hôm qua. Nếu tăng thì + còn giảm thì - tương ứng với màu xanh và đỏ.
- **Search:** Thanh tìm kiếm cho phép khách hàng tra cứu nhanh dịch vụ theo tên.
- **Category:** Dropdown danh sách các danh mục: Skincare, Massage, Combo, Therapy.
- **Status:** Hiển thị trạng thái của serivce là inactive hay active.
- **Button Add New Service:** Để thêm 1 dịch vụ mới nav đến trang thêm nhé!
- **Ở nút kebab trong card** thì dropdown có 2 lựa chọn: - **Edit:** Chỉnh sửa thông tin dịch vụ. - **Delete:** Xóa dịch vụ. -**Ở table**: Hiển thị mặc định 20 per page
- **Tính năng:** Thêm mới, Chỉnh sửa thông tin (tên, giá, mô tả), Xóa dịch vụ.
- **Tính năng thêm mới**:
  **Service Name:** Đây là tên dịch vụ sẽ hiển thị trên Service Card và trong danh sách dịch vụ.
  **Description:** Đây là mô tả chi tiết của dịch vụ, sẽ hiển thị khi bấm vào xem chi tiết dịch vụ.
  **Price:** Đây là giá của dịch vụ, sẽ hiển thị trên Service Card và trong danh sách dịch vụ.
  **Category:** Dropdown danh sách các danh mục: Skincare, Massage, Combo, Therapy.
  **Image:** Đây là ảnh của dịch vụ, sẽ hiển thị trên Service Card và trong danh sách dịch vụ.
  **Time:** Đây là thời gian của dịch vụ, sẽ hiển thị trên Service Card và trong danh sách dịch vụ.
  **Status:** Hiển thị trạng thái của serivce là inactive hay active.

#### D. Sidebar Navigation

- Menu điều hướng nhanh: Dashboard, Quản lý dịch vụ, Cài đặt hệ thống.

---

## 4. Quy trình nghiệp vụ (Business Flow)

### 4.1. Quy trình phía Admin

1.  Quản trị viên đăng nhập vào hệ thống.
2.  Cập nhật danh sách dịch vụ và giá cả.
3.  Tạo mã QR Menu.
4.  Theo dõi biểu đồ Traffic hàng ngày để đánh giá mức độ quan tâm của khách hàng.

### 4.2. Quy trình phía Khách hàng

1.  Khách hàng quét mã QR.
2.  Hệ thống hiển thị giao diện Menu.
3.  Khách hàng tìm kiếm hoặc lọc dịch vụ theo sở thích.
4.  Khách hàng xem chi tiết

---

## 5. Yêu cầu giao diện (UI/UX)

- **Phong cách thiết kế:** Hiện đại, cao cấp (Luxurious Modern), sử dụng Glassmorphism hoặc các dải Gradient mượt mà.
- **Màu sắc chủ đạo:**
  - Primary: Xanh Navy/Azure (Tượng trưng cho sự thư giãn, tin cậy).
  - Secondary: Gold/White (Tạo sự sang trọng).
- **Font:** Ưu tiên các font sans-serif hiện đại như Inter, Roboto hoặc Manrope.

---

## 6. Ghi chú kỹ thuật

- Hệ thống cần tích hợp bộ giải mã QR và tạo QR động.
- Trang Khách hàng yêu cầu tốc độ tải trang cực nhanh (Performance) để đảm bảo trải nghiệm tức thì khi quét mã.
- **Middleware Logic (Trạng thái QR):**
  - **Active:** Load trang Menu bình thường.
  - **Paused:** Không hiển thị Menu, tự động chuyển hướng hoặc hiển thị màn hình thông báo: "Dịch vụ đang tạm ngưng bảo trì, quý khách vui lòng quay lại sau." (Giao diện vẫn giữ Brand identity nhưng khóa các tương tác).
  - **Inactive / Not Generated:** Hiển thị trang lỗi 404 hoặc thông báo: "Mã QR chưa được kích hoạt hoặc không hợp lệ."
