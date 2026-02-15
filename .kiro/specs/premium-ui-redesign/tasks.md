# Implementation Plan: Premium UI Redesign

## Overview

ปรับปรุง base.html และ HTML pages ทั้งหมดให้มี premium Apple-like aesthetic โดยเริ่มจาก design system แล้วค่อยอัพเดทแต่ละ page

## Tasks

- [x] 1. Update CSS Variables and Typography System
  - [x] 1.1 Add new typography CSS variables (font-display, font-text, typography scale)
    - Add SF Pro Display with Inter fallback
    - Define --text-xs through --text-3xl
    - Define font weight variables
    - _Requirements: 1.1, 1.2, 1.3_
  - [x] 1.2 Add spacing system CSS variables
    - Define --space-1 through --space-16
    - _Requirements: 2.1_
  - [x] 1.3 Update body and heading styles with new typography
    - Apply letter-spacing -0.02em to -0.03em for headings
    - Apply letter-spacing -0.01em for body
    - Set line-height 1.2 for headings, 1.5 for body
    - _Requirements: 1.4, 1.5, 1.6_

- [x] 2. Implement Glass Morphism and Gradients
  - [x] 2.1 Add glass morphism CSS variables and utility class
    - Create .glass class with backdrop-filter blur(20px) saturate(180%)
    - Add semi-transparent backgrounds
    - Add inset box-shadow for inner glow
    - _Requirements: 4.1, 4.2, 4.4_
  - [x] 2.2 Update header with glass morphism effect
    - Apply 95% opacity background with blur
    - _Requirements: 4.5_
  - [x] 2.3 Add gradient system CSS variables
    - Define --gradient-primary, success, warning, danger
    - Add mesh gradient for hero sections
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  - [x] 2.4 Add gradient overlays to cards
    - Use ::before pseudo-element for depth effect
    - _Requirements: 5.6_

- [x] 3. Implement Animation System
  - [x] 3.1 Add animation timing CSS variables
    - Define --ease-out, --ease-spring, --ease-bounce
    - Define --duration-fast, --duration-normal, --duration-slow
    - _Requirements: 3.5_
  - [x] 3.2 Update button interactions
    - Add scale(0.97) on :active state
    - Add spring animation timing
    - _Requirements: 3.1_
  - [x] 3.3 Update card hover effects
    - Apply translateY(-4px) with 0.3s transition
    - _Requirements: 3.2_
  - [x] 3.4 Update modal animations
    - Use spring timing (0.4s cubic-bezier(0.32, 0.72, 0, 1))
    - _Requirements: 3.3_
  - [x] 3.5 Update input focus animations
    - Animate border and shadow with 0.2s transition
    - _Requirements: 3.4_
  - [x] 3.6 Add fade-in animation for appearing elements
    - Create @keyframes fadeIn with translateY
    - _Requirements: 3.6_

- [x] 4. Checkpoint - Review base styles
  - Ensure all CSS variables are defined correctly
  - Test glass morphism in browser
  - Verify animations are smooth

- [x] 5. Implement Skeleton Loading System
  - [x] 5.1 Create skeleton base styles
    - Add .skeleton class with shimmer animation
    - Define @keyframes shimmer with 1.5s duration
    - _Requirements: 7.2, 7.6_
  - [x] 5.2 Create skeleton component variants
    - .skeleton-text for text placeholders
    - .skeleton-circle for avatars/icons
    - .skeleton-card for card placeholders
    - _Requirements: 7.3_
  - [x] 5.3 Create skeleton templates for list items
    - Include title, subtitle, and badge skeletons
    - _Requirements: 7.4_
  - [x] 5.4 Create skeleton templates for stats
    - Include value and label skeletons
    - _Requirements: 7.5_

- [x] 6. Implement Icon System Updates
  - [x] 6.1 Add icon size CSS variables
    - Define --icon-sm (16px), --icon-md (20px), --icon-lg (24px), --icon-xl (32px)
    - _Requirements: 6.2_
  - [x] 6.2 Add global SVG icon styles
    - Set stroke-width: 1.5 for all icons
    - Set stroke-linecap: round and stroke-linejoin: round
    - _Requirements: 6.1, 6.5_
  - [x] 6.3 Update button icon styles
    - Set 18px size with 8px gap
    - _Requirements: 6.3_
  - [x] 6.4 Update navigation icon styles
    - Set 24px size for nav icons
    - _Requirements: 6.4_

- [x] 7. Implement Visual Feedback System
  - [x] 7.1 Add success animation
    - Create @keyframes success-check with stroke-dashoffset animation
    - _Requirements: 8.2_
  - [x] 7.2 Add error shake animation
    - Create @keyframes shake
    - _Requirements: 8.3_
  - [x] 7.3 Add pulse animation for error states
    - Create @keyframes pulse
    - Update .has-error styles with pulse
    - _Requirements: 8.4_
  - [x] 7.4 Add button loading state styles
    - Create .btn-loading class with spinner
    - _Requirements: 8.5_
  - [x] 7.5 Add color transition for state changes
    - Ensure all interactive elements have color transitions
    - _Requirements: 8.6_

- [x] 8. Checkpoint - Review all base.html changes
  - Ensure all tests pass, ask the user if questions arise
  - Verify no CSS conflicts
  - Test in browser

- [x] 9. Update Spacing in Components
  - [x] 9.1 Update card padding to 24px minimum
    - _Requirements: 2.2_
  - [x] 9.2 Update section gaps to 20px minimum
    - _Requirements: 2.3_
  - [x] 9.3 Update header padding (64px top, 32px bottom)
    - _Requirements: 2.4_
  - [x] 9.4 Update list item padding to 18px vertical
    - _Requirements: 2.5_

- [x] 10. Update modal overlay styles
  - Apply backdrop-filter: blur(16px) with dark overlay
  - _Requirements: 4.3_

- [x] 11. Update HTML pages to use skeleton loading
  - [x] 11.1 Update dashboard.html with skeleton loading
    - Replace spinner with skeleton components
  - [x] 11.2 Update products.html with skeleton loading
    - Replace spinner with skeleton list items
  - [x] 11.3 Update logs.html with skeleton loading
    - Replace spinner with skeleton components

- [x] 12. Final checkpoint
  - Ensure all pages render correctly
  - Test all animations and interactions
  - Verify visual consistency across pages

## Notes

- All changes focus on base.html first since it's the shared design system
- HTML pages only need updates for skeleton loading implementation
- Manual visual testing is primary validation method for CSS changes
- Test on iOS Safari for backdrop-filter compatibility
