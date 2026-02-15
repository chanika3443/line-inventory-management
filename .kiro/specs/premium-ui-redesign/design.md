# Design Document: Premium UI Redesign

## Overview

การปรับปรุง UI ให้มีความหรูหราแบบ Apple โดยปรับปรุง base.html ซึ่งเป็น design system หลัก และอัพเดท HTML pages ทั้งหมดให้ใช้ components ใหม่ การออกแบบเน้น minimal, elegant และ premium feel

## Architecture

```
src/
├── base.html          # Design System (CSS Variables, Components)
├── index.html         # Home page
├── dashboard.html     # Dashboard
├── products.html      # Product management
├── withdraw.html      # Withdraw transactions
├── receive.html       # Receive transactions
├── reports.html       # Reports
└── logs.html          # Transaction logs
```

การปรับปรุงจะทำที่ `base.html` เป็นหลัก เนื่องจากเป็น shared styles ที่ทุกหน้าใช้ร่วมกัน

## Components and Interfaces

### 1. Typography System

```css
:root {
  /* Font Family */
  --font-display: 'SF Pro Display', 'Inter', -apple-system, sans-serif;
  --font-text: 'SF Pro Text', 'Inter', -apple-system, sans-serif;
  
  /* Typography Scale */
  --text-xs: 11px;
  --text-sm: 13px;
  --text-base: 15px;
  --text-md: 17px;
  --text-lg: 20px;
  --text-xl: 24px;
  --text-2xl: 28px;
  --text-3xl: 34px;
  
  /* Font Weights */
  --font-regular: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
}
```

### 2. Spacing System

```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
}
```

### 3. Glass Morphism Components

```css
.glass {
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow: 
    0 4px 24px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
}
```

### 4. Animation System

```css
:root {
  /* Timing Functions */
  --ease-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-spring: cubic-bezier(0.32, 0.72, 0, 1);
  --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
  
  /* Durations */
  --duration-fast: 0.15s;
  --duration-normal: 0.25s;
  --duration-slow: 0.35s;
}

/* Button Press Animation */
.btn:active {
  transform: scale(0.97);
}

/* Card Hover Animation */
.card:hover {
  transform: translateY(-4px);
}
```

### 5. Gradient System

```css
:root {
  --gradient-primary: linear-gradient(135deg, #007AFF 0%, #5856D6 100%);
  --gradient-success: linear-gradient(135deg, #30D158 0%, #34C759 100%);
  --gradient-warning: linear-gradient(135deg, #FF9F0A 0%, #FF6B00 100%);
  --gradient-danger: linear-gradient(135deg, #FF453A 0%, #FF3B30 100%);
  --gradient-mesh: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
}
```

### 6. Skeleton Loading Component

```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--bg-tertiary) 0%,
    var(--bg-secondary) 50%,
    var(--bg-tertiary) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: inherit;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### 7. Icon System

```css
/* Icon Sizes */
--icon-sm: 16px;
--icon-md: 20px;
--icon-lg: 24px;
--icon-xl: 32px;

/* Icon Styling */
svg {
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}
```

### 8. Feedback Animations

```css
@keyframes success-check {
  0% { stroke-dashoffset: 24; }
  100% { stroke-dashoffset: 0; }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-8px); }
  75% { transform: translateX(8px); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
```

## Data Models

ไม่มี data model ใหม่ - การปรับปรุงนี้เป็น CSS/UI เท่านั้น

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Icon Consistency

*For any* SVG icon element in the design system, the stroke-width SHALL be 1.5px, stroke-linecap SHALL be "round", and stroke-linejoin SHALL be "round"

**Validates: Requirements 6.1, 6.5**

### Property 2: Skeleton Border Radius Matching

*For any* skeleton loading element, its border-radius SHALL match the border-radius of the content element it represents

**Validates: Requirements 7.3**

## Error Handling

### CSS Fallbacks
- ใช้ fallback fonts สำหรับ SF Pro Display
- ใช้ -webkit-backdrop-filter สำหรับ Safari compatibility
- ใช้ standard appearance property ร่วมกับ -webkit-appearance

### Browser Compatibility
- backdrop-filter: ใช้ได้ใน modern browsers, fallback เป็น solid background
- CSS variables: supported ใน all modern browsers

## Testing Strategy

### Unit Tests
- ตรวจสอบ CSS variables ถูกกำหนดครบถ้วน
- ตรวจสอบ animation keyframes ถูกต้อง
- ตรวจสอบ component classes มี properties ที่ต้องการ

### Property-Based Tests
- Property 1: ตรวจสอบ icon consistency ทุก SVG element
- Property 2: ตรวจสอบ skeleton border-radius matching

### Visual Testing
- Manual review บน iOS Safari, Chrome, Firefox
- ตรวจสอบ animations smooth และไม่กระตุก
- ตรวจสอบ glass morphism effect แสดงผลถูกต้อง

### Testing Framework
เนื่องจากเป็น CSS/HTML changes จะใช้ manual visual testing เป็นหลัก ร่วมกับ browser DevTools inspection
