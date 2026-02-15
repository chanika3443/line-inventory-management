---
inclusion: auto
---

# React Best Practices for LINE Inventory Management

## Component Structure

- Use functional components with hooks
- Keep components small and focused (single responsibility)
- Extract reusable logic into custom hooks
- Use proper prop types validation

## State Management

- Use Context API for global state (LIFF, Sheets data)
- Keep local state in components when possible
- Avoid prop drilling - use context for deeply nested data
- Use useReducer for complex state logic

## Performance

- Memoize expensive calculations with useMemo
- Memoize callbacks with useCallback
- Use React.memo for components that render often
- Lazy load routes and heavy components
- Debounce search inputs and API calls

## API Calls

- Always handle loading and error states
- Use try-catch for async operations
- Show user-friendly error messages
- Implement retry logic for failed requests
- Cache data when appropriate (localStorage, context)

## LIFF Integration

- Initialize LIFF in a context provider
- Check LIFF.isLoggedIn() before API calls
- Handle LIFF errors gracefully
- Use LIFF profile for user identification

## Google Sheets API

- Batch read/write operations when possible
- Respect API quota limits (100 requests/100 seconds)
- Cache frequently accessed data
- Use proper error handling for API failures
- Format data consistently (dates, numbers, booleans)

## Styling

- Use CSS modules or styled-components
- Follow mobile-first approach
- Ensure touch-friendly UI (44px minimum touch targets)
- Use CSS variables for theming
- Support safe area insets for iOS

## Code Organization

```
src/
├── components/     # Reusable UI components
├── pages/         # Route components
├── contexts/      # React contexts
├── hooks/         # Custom hooks
├── services/      # API services
├── utils/         # Helper functions
├── styles/        # Global styles
└── config/        # Configuration
```

## Error Handling

- Always show user-friendly error messages in Thai
- Log errors to console for debugging
- Implement error boundaries for critical sections
- Provide fallback UI for errors

## Testing

- Write unit tests for utility functions
- Test custom hooks
- Test critical user flows
- Mock LIFF and Sheets API in tests

## Accessibility

- Use semantic HTML
- Add proper ARIA labels
- Ensure keyboard navigation works
- Test with screen readers
- Maintain good color contrast

## Security

- Never commit API keys or secrets
- Use environment variables for sensitive data
- Validate user input
- Sanitize data before rendering
- Use HTTPS only
