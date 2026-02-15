---
inclusion: auto
---

# LINE Inventory Management - Project Context

## Overview

This is a React-based inventory management system for LINE LIFF, deployed on GitHub Pages. It replaces the previous Google Apps Script implementation.

## Tech Stack

- **Frontend**: React 18 + Vite
- **Routing**: React Router v6
- **State**: Context API
- **API**: Google Sheets API v4
- **Auth**: LINE LIFF SDK
- **Deployment**: GitHub Pages + GitHub Actions
- **Styling**: CSS (Apple-inspired design)

## Key Features

1. **Inventory Management**
   - Add/Edit/Delete products
   - Track stock levels
   - Low stock alerts
   - Returnable items flag

2. **Transactions**
   - Withdraw (เบิก)
   - Receive (รับเข้า)
   - Return (คืน)
   - Transaction history

3. **Reporting**
   - Dashboard with statistics
   - Transaction logs
   - Reports with filters
   - Charts and visualizations

4. **LINE Integration**
   - LIFF authentication
   - User profile integration
   - Mobile-optimized UI

## Data Structure

### Products Sheet
| Column | Name | Type | Description |
|--------|------|------|-------------|
| A | code | String | Product code (P0001, P0002, ...) |
| B | name | String | Product name |
| C | unit | String | Unit (ชิ้น, กล่อง, etc.) |
| D | quantity | Number | Current stock |
| E | lowStockThreshold | Number | Alert threshold |
| F | category | String | Category |
| G | returnable | Boolean | Can be returned (TRUE/FALSE) |
| H | createdAt | Date | Created timestamp |
| I | updatedAt | Date | Last updated timestamp |

### Transactions Sheet
| Column | Name | Type | Description |
|--------|------|------|-------------|
| A | id | String | Transaction ID |
| B | timestamp | Date | Transaction time |
| C | type | String | WITHDRAW/RECEIVE/RETURN/CREATE/EDIT/DELETE |
| D | productCode | String | Product code |
| E | productName | String | Product name |
| F | quantity | Number | Transaction quantity |
| G | beforeQuantity | Number | Stock before |
| H | afterQuantity | Number | Stock after |
| I | userName | String | User name |
| J | note | String | Notes |

## Environment Variables

```env
VITE_LIFF_ID=2008893142-t04JvNpe
VITE_SPREADSHEET_ID=13231Zdy1BQbX0BDmCVGIAgsKRJx_7UdDvxVBNO8MUM8
VITE_GOOGLE_API_KEY=<your-api-key>
```

## API Endpoints

### Google Sheets API
- Base: `https://sheets.googleapis.com/v4/spreadsheets/{spreadsheetId}`
- Read: `GET /values/{range}`
- Write: `PUT /values/{range}`
- Append: `POST /values/{range}:append`
- Batch: `POST /values:batchUpdate`

## Navigation Structure

```
/ (Home)
├── /withdraw (เบิกวัสดุ)
├── /receive (รับเข้า)
├── /return (คืนวัสดุ)
├── /dashboard (ภาพรวม)
├── /reports (รายงาน)
├── /logs (ประวัติ)
└── /products (จัดการวัสดุ)
```

## Bottom Navigation

1. หน้าแรก (Home)
2. เบิก (Withdraw)
3. รับเข้า (Receive)
4. คืน (Return)
5. อื่นๆ (Dashboard/More)

## Design System

- **Colors**: Apple-inspired (iOS style)
- **Typography**: Inter font family
- **Spacing**: 4px base unit
- **Border Radius**: 10-20px
- **Shadows**: Subtle, layered
- **Animations**: Smooth, 0.25s ease

## Common Patterns

### Loading State
```jsx
{loading && <LoadingSpinner />}
{error && <ErrorMessage message={error} />}
{data && <DataDisplay data={data} />}
```

### Modal Pattern
```jsx
<Modal isOpen={isOpen} onClose={handleClose}>
  <ModalHeader title="Title" />
  <ModalBody>{content}</ModalBody>
  <ModalFooter>
    <Button onClick={handleClose}>Cancel</Button>
    <Button onClick={handleConfirm}>Confirm</Button>
  </ModalFooter>
</Modal>
```

### Form Pattern
```jsx
<form onSubmit={handleSubmit}>
  <FormGroup error={errors.field}>
    <Label>Label</Label>
    <Input value={value} onChange={handleChange} />
    {errors.field && <ErrorText>{errors.field}</ErrorText>}
  </FormGroup>
  <Button type="submit">Submit</Button>
</form>
```

## Important Notes

1. **API Quota**: Google Sheets API has limits (100 requests/100 seconds/user)
2. **Caching**: Cache data in context/localStorage to reduce API calls
3. **Mobile First**: Design for mobile, enhance for desktop
4. **Thai Language**: All UI text in Thai
5. **LIFF Context**: Always check LIFF.isLoggedIn() before operations
6. **Error Handling**: Show user-friendly Thai error messages
7. **Offline Support**: Consider implementing offline mode with localStorage
8. **Performance**: Lazy load routes, memoize expensive operations

## Migration from Apps Script

Key differences:
- No server-side code execution
- Direct API calls from client
- Need API key management
- CORS considerations
- Client-side data validation
- No Apps Script triggers (use polling or webhooks)
