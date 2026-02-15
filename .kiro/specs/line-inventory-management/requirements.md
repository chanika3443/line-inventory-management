# Requirements Document

## Introduction

ระบบจัดการสินค้าคงคลัง (Inventory Management System) ที่ทำงานผ่าน LINE Official Account โดยใช้ Google Sheets เป็นฐานข้อมูล และ Google Apps Script เป็น backend ระบบนี้ช่วยให้ผู้ใช้สามารถจัดการสต็อกสินค้า เบิก-รับเข้า และดูรายงานได้อย่างสะดวกผ่าน LINE

## Glossary

- **LINE_OA**: LINE Official Account ที่ใช้เป็น interface หลักในการติดต่อกับผู้ใช้
- **Flex_Message**: รูปแบบข้อความ LINE ที่แสดงเป็น grid หรือ card สำหรับเลือกเมนู
- **LIFF**: LINE Front-end Framework สำหรับแสดง Web View ภายใน LINE
- **Apps_Script**: Google Apps Script ที่ทำหน้าที่เป็น backend และ API
- **Product**: สินค้าในระบบคลัง ประกอบด้วย รหัส ชื่อ จำนวน หน่วย และข้อมูลอื่นๆ
- **Withdrawal**: การเบิกสินค้าออกจากคลัง
- **Receipt**: การรับสินค้าเข้าคลัง
- **Transaction_Log**: บันทึกการทำรายการทุกครั้ง (เบิก/รับเข้า/แก้ไข)
- **Low_Stock_Threshold**: จุดเตือนสินค้าใกล้หมด

## Requirements

### Requirement 1: การจัดการเมนูหลักผ่าน LINE

**User Story:** As a user, I want to see a menu grid in LINE chat, so that I can easily navigate to different functions of the inventory system.

#### Acceptance Criteria

1. WHEN a user sends a message or follows the LINE OA, THE LINE_OA SHALL display a Flex_Message with menu options including: จัดการสินค้า, เบิกสินค้า, รับเข้าสินค้า, รายงาน, และ Dashboard
2. WHEN a user taps on a menu item, THE LINE_OA SHALL open the corresponding LIFF web view
3. THE Flex_Message SHALL display icons and labels clearly for each menu option

### Requirement 2: การจัดการสินค้า (CRUD)

**User Story:** As a warehouse manager, I want to add, edit, and delete products, so that I can maintain an accurate product catalog.

#### Acceptance Criteria

1. WHEN a user opens the product management LIFF, THE System SHALL display a list of all products with search and filter capabilities
2. WHEN a user adds a new product, THE System SHALL create a new record in Google Sheets with product code, name, unit, initial quantity, and low stock threshold
3. WHEN a user edits a product, THE System SHALL update the corresponding record in Google Sheets
4. WHEN a user deletes a product, THE System SHALL remove the product from Google Sheets and log the deletion
5. THE System SHALL validate that product code is unique before creating a new product
6. IF a user attempts to add a product with duplicate code, THEN THE System SHALL display an error message and prevent the addition

### Requirement 3: การเบิกสินค้า (Withdrawal)

**User Story:** As a staff member, I want to withdraw products from inventory, so that I can use them for operations.

#### Acceptance Criteria

1. WHEN a user opens the withdrawal LIFF, THE System SHALL display a form to select product, enter quantity, and enter requester name
2. WHEN a user submits a withdrawal request, THE System SHALL validate that the requested quantity does not exceed available stock
3. IF a user attempts to withdraw more than available stock, THEN THE System SHALL display an error message showing current stock and prevent the withdrawal
4. WHEN a valid withdrawal is submitted, THE System SHALL deduct the quantity from product stock and create a Transaction_Log entry
5. THE System SHALL require requester name before allowing withdrawal submission
6. WHEN withdrawal is successful, THE System SHALL display a confirmation message with transaction details

### Requirement 4: การรับเข้าสินค้า (Receipt)

**User Story:** As a warehouse manager, I want to receive products into inventory, so that I can update stock levels when new items arrive.

#### Acceptance Criteria

1. WHEN a user opens the receipt LIFF, THE System SHALL display a form to select product, enter quantity, and enter receiver name
2. WHEN a user submits a receipt, THE System SHALL add the quantity to product stock and create a Transaction_Log entry
3. THE System SHALL require receiver name before allowing receipt submission
4. WHEN receipt is successful, THE System SHALL display a confirmation message with transaction details
5. THE System SHALL validate that quantity is a positive number

### Requirement 5: Dashboard และ Banner สรุปภาพรวม

**User Story:** As a manager, I want to see an overview dashboard, so that I can quickly understand inventory status and identify low stock items.

#### Acceptance Criteria

1. WHEN a user opens the dashboard LIFF, THE System SHALL display a banner showing total product count, total stock value, and count of low stock items
2. THE System SHALL display a list of products that are at or below their Low_Stock_Threshold
3. WHEN a product's quantity falls to or below its Low_Stock_Threshold, THE System SHALL highlight it as "low stock" in the dashboard
4. THE Dashboard SHALL refresh data when opened to show current status

### Requirement 6: ระบบ Logs และประวัติการทำรายการ

**User Story:** As an auditor, I want to view complete transaction logs, so that I can track all inventory movements and changes.

#### Acceptance Criteria

1. THE System SHALL log every transaction with: timestamp, transaction type (withdrawal/receipt/edit/delete), product code, product name, quantity, before quantity, after quantity, and user name
2. WHEN a user views logs, THE System SHALL display transactions in reverse chronological order
3. THE System SHALL provide filters for: date range, transaction type, product, and user name
4. THE System SHALL persist all logs in a dedicated Google Sheets tab

### Requirement 7: ระบบรายงาน (Reports)

**User Story:** As a manager, I want to generate reports with filters, so that I can analyze inventory movements over specific periods.

#### Acceptance Criteria

1. WHEN a user opens the report LIFF, THE System SHALL display filter options for: date range, product category, transaction type
2. WHEN filters are applied, THE System SHALL display matching transactions with summary statistics
3. THE Report SHALL show: total withdrawals, total receipts, net change, and current stock for filtered items
4. THE System SHALL allow exporting report data (display in printable format)

### Requirement 8: การจัดเก็บข้อมูลใน Google Sheets

**User Story:** As a system administrator, I want data stored in Google Sheets, so that I can easily access and backup inventory data.

#### Acceptance Criteria

1. THE Apps_Script SHALL use Google Sheets as the primary database
2. THE System SHALL organize data into separate sheets: Products, Transactions, Settings
3. WHEN any data operation occurs, THE Apps_Script SHALL read from and write to the appropriate Google Sheet
4. THE System SHALL handle concurrent access gracefully using Apps Script's built-in locking mechanism

### Requirement 9: ความปลอดภัยและการยืนยันตัวตน

**User Story:** As a system owner, I want users to confirm their identity before transactions, so that I can track who performed each action.

#### Acceptance Criteria

1. WHEN a user initiates a withdrawal or receipt, THE System SHALL require entering their name
2. THE System SHALL store the user name with each transaction in the log
3. THE LIFF SHALL retrieve LINE user profile when available to pre-fill user information
