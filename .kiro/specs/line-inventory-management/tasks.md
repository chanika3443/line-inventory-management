# Implementation Plan: LINE Inventory Management System

## Overview

สร้างระบบจัดการสินค้าคงคลังผ่าน LINE OA โดยใช้ Google Apps Script เป็น backend และ Google Sheets เป็นฐานข้อมูล พัฒนาแบบ incremental โดยเริ่มจาก core services ไปจนถึง UI

## Tasks

- [x] 1. Setup project structure and Google Sheets
  - [x] 1.1 Create Google Apps Script project structure
    - สร้างไฟล์หลัก: Code.gs, SheetService.gs, ProductService.gs, TransactionService.gs
    - สร้างไฟล์ HTML templates สำหรับ LIFF pages
    - _Requirements: 8.1, 8.2_
  - [x] 1.2 Initialize Google Sheets structure
    - สร้าง Products sheet พร้อม headers
    - สร้าง Transactions sheet พร้อม headers
    - สร้าง Settings sheet พร้อม headers
    - _Requirements: 8.2, 8.3_

- [x] 2. Implement Sheet Service (Data Layer)
  - [x] 2.1 Implement SheetService core functions
    - getSheet(sheetName): ดึง sheet ตามชื่อ
    - readData(sheetName): อ่านข้อมูลทั้งหมดจาก sheet
    - writeRow(sheetName, row): เขียนแถวใหม่
    - updateRow(sheetName, rowIndex, row): อัพเดทแถว
    - deleteRow(sheetName, rowIndex): ลบแถว
    - findRow(sheetName, column, value): ค้นหาแถวตาม column และ value
    - _Requirements: 8.3_
  - [x] 2.2 Write property test for Sheet Service round-trip
    - **Property 1: Product CRUD Round-Trip**
    - **Validates: Requirements 2.2**

- [x] 3. Implement Product Service
  - [x] 3.1 Implement getAllProducts and getProductByCode
    - getAllProducts(): ดึงสินค้าทั้งหมดจาก Products sheet
    - getProductByCode(code): ค้นหาสินค้าตามรหัส
    - _Requirements: 2.1_
  - [x] 3.2 Implement addProduct with validation
    - ตรวจสอบ required fields (code, name, unit)
    - ตรวจสอบ product code uniqueness
    - เขียนข้อมูลลง Products sheet
    - สร้าง transaction log สำหรับ CREATE
    - _Requirements: 2.2, 2.5, 2.6_
  - [x] 3.3 Write property test for product code uniqueness
    - **Property 4: Product Code Uniqueness**
    - **Validates: Requirements 2.5, 2.6**
  - [x] 3.4 Implement updateProduct
    - ค้นหาสินค้าตาม code
    - อัพเดทข้อมูลใน Products sheet
    - สร้าง transaction log สำหรับ EDIT
    - _Requirements: 2.3_
  - [x] 3.5 Write property test for product update consistency
    - **Property 2: Product Update Consistency**
    - **Validates: Requirements 2.3**
  - [x] 3.6 Implement deleteProduct
    - ค้นหาและลบสินค้าจาก Products sheet
    - สร้าง transaction log สำหรับ DELETE
    - _Requirements: 2.4_
  - [x] 3.7 Write property test for product deletion
    - **Property 3: Product Deletion Completeness**
    - **Validates: Requirements 2.4**
  - [x] 3.8 Implement getLowStockProducts
    - ดึงสินค้าที่ quantity <= lowStockThreshold
    - _Requirements: 5.2, 5.3_
  - [x] 3.9 Write property test for low stock detection
    - **Property 10: Low Stock Detection**
    - **Validates: Requirements 5.2, 5.3**

- [x] 4. Checkpoint - Product Service
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement Transaction Service
  - [x] 5.1 Implement withdraw function
    - ตรวจสอบว่าสินค้ามีอยู่
    - ตรวจสอบ userName ไม่ว่าง
    - ตรวจสอบ quantity <= stock (ป้องกันเบิกเกิน)
    - หัก quantity จาก product
    - สร้าง transaction log
    - _Requirements: 3.2, 3.3, 3.4, 3.5_
  - [x] 5.2 Write property test for withdrawal stock validation
    - **Property 5: Withdrawal Stock Validation**
    - **Validates: Requirements 3.2, 3.3**
  - [x] 5.3 Write property test for withdrawal quantity deduction
    - **Property 6: Withdrawal Quantity Deduction**
    - **Validates: Requirements 3.4**
  - [x] 5.4 Implement receive function
    - ตรวจสอบว่าสินค้ามีอยู่
    - ตรวจสอบ userName ไม่ว่าง
    - ตรวจสอบ quantity > 0
    - เพิ่ม quantity ให้ product
    - สร้าง transaction log
    - _Requirements: 4.2, 4.3, 4.5_
  - [x] 5.5 Write property test for receipt quantity addition
    - **Property 7: Receipt Quantity Addition**
    - **Validates: Requirements 4.2**
  - [x] 5.6 Write property test for user name requirement
    - **Property 8: Transaction User Name Requirement**
    - **Validates: Requirements 3.5, 4.3, 9.1**
  - [x] 5.7 Write property test for positive quantity validation
    - **Property 9: Positive Quantity Validation**
    - **Validates: Requirements 4.5**
  - [x] 5.8 Implement createLog function
    - สร้าง log entry พร้อม timestamp, type, product info, quantities, userName
    - เขียนลง Transactions sheet
    - _Requirements: 6.1, 9.2_
  - [x] 5.9 Write property test for transaction log completeness
    - **Property 12: Transaction Log Completeness**
    - **Validates: Requirements 6.1, 9.2**
  - [x] 5.10 Implement getTransactionLogs with filters
    - รองรับ filter: date range, type, productCode, userName
    - เรียงตาม timestamp descending
    - _Requirements: 6.2, 6.3_
  - [x] 5.11 Write property test for log filtering
    - **Property 13: Log Filtering Correctness**
    - **Validates: Requirements 6.2, 6.3**

- [x] 6. Checkpoint - Transaction Service
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement Dashboard and Report Services
  - [x] 7.1 Implement getDashboardData
    - คำนวณ totalProducts, totalQuantity, lowStockCount
    - ดึงรายการ low stock products
    - _Requirements: 5.1_
  - [x] 7.2 Write property test for dashboard statistics
    - **Property 11: Dashboard Statistics Accuracy**
    - **Validates: Requirements 5.1**
  - [x] 7.3 Implement getReport with filters and summary
    - รองรับ filter: date range, category, transactionType
    - คำนวณ totalWithdrawals, totalReceipts, netChange
    - _Requirements: 7.2, 7.3_
  - [x] 7.4 Write property test for report summary accuracy
    - **Property 14: Report Summary Accuracy**
    - **Validates: Requirements 7.2, 7.3**

- [x] 8. Implement Apps Script API Layer
  - [x] 8.1 Implement doGet handler
    - Route requests based on ?page= parameter
    - Serve HTML pages for LIFF
    - Handle ?action= for API calls (getProducts, getLogs, etc.)
    - _Requirements: 8.3_
  - [x] 8.2 Implement doPost handler
    - Handle addProduct, updateProduct, deleteProduct
    - Handle withdraw, receive
    - Return JSON responses
    - _Requirements: 8.3_
  - [x] 8.3 Implement LINE webhook handler
    - รับ webhook events จาก LINE
    - ตอบกลับด้วย Flex Message menu
    - _Requirements: 1.1_

- [x] 9. Checkpoint - API Layer
  - Ensure all API endpoints work correctly, ask the user if questions arise.

- [x] 10. Implement LIFF HTML Pages
  - [x] 10.1 Create base HTML template with common styles
    - สร้าง template พื้นฐานพร้อม CSS
    - รองรับ mobile-first design
    - Include LIFF SDK
    - _Requirements: 1.2_
  - [x] 10.2 Create Product Management page (products.html)
    - แสดงรายการสินค้าพร้อม search
    - Form สำหรับ เพิ่ม/แก้ไข/ลบ สินค้า
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  - [x] 10.3 Create Withdrawal page (withdraw.html)
    - Dropdown เลือกสินค้า (แสดง stock คงเหลือ)
    - Input จำนวนเบิก พร้อม validation
    - Input ชื่อผู้เบิก (required)
    - แสดง error ถ้าเบิกเกิน stock
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_
  - [x] 10.4 Create Receipt page (receive.html)
    - Dropdown เลือกสินค้า
    - Input จำนวนรับเข้า พร้อม validation
    - Input ชื่อผู้รับ (required)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  - [x] 10.5 Create Dashboard page (dashboard.html)
    - Banner แสดง summary (total products, low stock count)
    - รายการสินค้าใกล้หมด
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  - [x] 10.6 Create Reports page (reports.html)
    - Filter controls (date range, type, product)
    - ตารางแสดง transactions
    - Summary statistics
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  - [x] 10.7 Create Logs page (logs.html)
    - Filter controls
    - ตารางแสดง transaction logs
    - _Requirements: 6.2, 6.3_

- [x] 11. Create LINE Flex Message Menu
  - [x] 11.1 Implement Flex Message JSON structure
    - สร้าง grid menu พร้อม icons
    - Link ไปยัง LIFF URLs
    - _Requirements: 1.1, 1.2, 1.3_

- [x] 12. Final Checkpoint
  - Ensure all tests pass and all features work end-to-end, ask the user if questions arise.

## Notes

- ทุก tasks รวม property-based tests เป็น required
- ใช้ Google Apps Script built-in LockService สำหรับ concurrent access
- LIFF pages ใช้ vanilla JavaScript เพื่อความเรียบง่าย
- ทุก API response เป็น JSON format
