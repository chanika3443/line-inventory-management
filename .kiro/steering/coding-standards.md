---
inclusion: auto
---

# Coding Standards

## File Naming

- **Components**: PascalCase (e.g., `ProductCard.jsx`, `BottomNav.jsx`)
- **Utilities**: camelCase (e.g., `formatDate.js`, `validateInput.js`)
- **Styles**: kebab-case (e.g., `global.css`, `product-card.css`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_ENDPOINTS.js`)

## Component Structure

```jsx
// 1. Imports
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiff } from '../contexts/LiffContext'
import Button from '../components/Button'
import './ProductCard.css'

// 2. Component
function ProductCard({ product, onEdit, onDelete }) {
  // 2.1 Hooks
  const navigate = useNavigate()
  const { user } = useLiff()
  const [loading, setLoading] = useState(false)
  
  // 2.2 Effects
  useEffect(() => {
    // Effect logic
  }, [])
  
  // 2.3 Handlers
  const handleEdit = () => {
    onEdit(product.code)
  }
  
  const handleDelete = async () => {
    setLoading(true)
    try {
      await onDelete(product.code)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }
  
  // 2.4 Render helpers
  const renderStatus = () => {
    if (product.quantity <= 0) return <Badge color="red">หมด</Badge>
    if (product.quantity <= product.lowStockThreshold) {
      return <Badge color="orange">ใกล้หมด</Badge>
    }
    return <Badge color="green">พร้อมใช้</Badge>
  }
  
  // 2.5 Early returns
  if (!product) return null
  if (loading) return <LoadingSpinner />
  
  // 2.6 Main render
  return (
    <div className="product-card">
      <h3>{product.name}</h3>
      <p>{product.code}</p>
      {renderStatus()}
      <div className="actions">
        <Button onClick={handleEdit}>แก้ไข</Button>
        <Button onClick={handleDelete} variant="danger">ลบ</Button>
      </div>
    </div>
  )
}

// 3. PropTypes (optional but recommended)
ProductCard.propTypes = {
  product: PropTypes.object.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired
}

// 4. Export
export default ProductCard
```

## Naming Conventions

### Variables
```javascript
// Boolean: use is/has/can prefix
const isLoading = true
const hasError = false
const canEdit = true

// Arrays: use plural
const products = []
const transactions = []

// Objects: use singular
const product = {}
const user = {}

// Functions: use verb prefix
const handleClick = () => {}
const fetchProducts = async () => {}
const validateForm = () => {}
```

### Functions
```javascript
// Event handlers: handle + Event
const handleSubmit = (e) => {}
const handleChange = (e) => {}
const handleClick = () => {}

// API calls: verb + Noun
const fetchProducts = async () => {}
const createProduct = async (data) => {}
const updateProduct = async (code, data) => {}
const deleteProduct = async (code) => {}

// Utilities: verb + Noun
const formatDate = (date) => {}
const validateEmail = (email) => {}
const calculateTotal = (items) => {}
```

## Code Style

### Spacing
```javascript
// Use 2 spaces for indentation
function example() {
  if (condition) {
    doSomething()
  }
}

// Space after keywords
if (condition) {}
for (let i = 0; i < 10; i++) {}

// Space around operators
const sum = a + b
const isValid = x === y

// No space before function parentheses
function myFunction() {}
const arrow = () => {}
```

### Quotes
```javascript
// Use single quotes for strings
const name = 'John'
const message = 'Hello World'

// Use template literals for interpolation
const greeting = `Hello ${name}`
```

### Semicolons
```javascript
// Always use semicolons
const x = 1;
const y = 2;
```

### Line Length
- Maximum 100 characters per line
- Break long lines logically

### Comments
```javascript
// Single line comment

/**
 * Multi-line comment
 * Describe complex logic
 */

// TODO: Add error handling
// FIXME: Bug in calculation
// NOTE: Important information
```

## React Patterns

### State Management
```javascript
// Use useState for simple state
const [count, setCount] = useState(0)

// Use useReducer for complex state
const [state, dispatch] = useReducer(reducer, initialState)

// Use context for global state
const { user, setUser } = useAuth()
```

### Effects
```javascript
// Cleanup effects
useEffect(() => {
  const subscription = subscribe()
  return () => subscription.unsubscribe()
}, [])

// Dependency array
useEffect(() => {
  fetchData(id)
}, [id]) // Only re-run when id changes
```

### Conditional Rendering
```javascript
// Use && for simple conditions
{isLoading && <LoadingSpinner />}

// Use ternary for if-else
{isLoggedIn ? <Dashboard /> : <Login />}

// Use early return for complex conditions
if (!data) return <EmptyState />
if (error) return <ErrorMessage error={error} />
return <DataDisplay data={data} />
```

### Lists
```javascript
// Always use key prop
{products.map(product => (
  <ProductCard key={product.code} product={product} />
))}

// Use index only as last resort
{items.map((item, index) => (
  <div key={index}>{item}</div>
))}
```

## Error Handling

```javascript
// Try-catch for async operations
const fetchData = async () => {
  try {
    setLoading(true)
    const data = await api.getData()
    setData(data)
  } catch (error) {
    console.error('Error fetching data:', error)
    setError('เกิดข้อผิดพลาดในการโหลดข้อมูล')
  } finally {
    setLoading(false)
  }
}

// Error boundaries for component errors
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    console.error('Error:', error, errorInfo)
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback />
    }
    return this.props.children
  }
}
```

## Performance

```javascript
// Memoize expensive calculations
const total = useMemo(() => {
  return items.reduce((sum, item) => sum + item.price, 0)
}, [items])

// Memoize callbacks
const handleClick = useCallback(() => {
  doSomething(id)
}, [id])

// Memoize components
const MemoizedComponent = React.memo(Component)

// Lazy load routes
const Dashboard = lazy(() => import('./pages/Dashboard'))
```

## Accessibility

```javascript
// Use semantic HTML
<button onClick={handleClick}>Click me</button>
<nav>...</nav>
<main>...</main>

// Add ARIA labels
<button aria-label="ปิด" onClick={handleClose}>×</button>

// Keyboard navigation
<div 
  role="button" 
  tabIndex={0}
  onClick={handleClick}
  onKeyPress={(e) => e.key === 'Enter' && handleClick()}
>
  Click me
</div>
```

## Testing

```javascript
// Test file naming: ComponentName.test.jsx
// Test structure
describe('ProductCard', () => {
  it('renders product name', () => {
    // Arrange
    const product = { name: 'Test Product' }
    
    // Act
    render(<ProductCard product={product} />)
    
    // Assert
    expect(screen.getByText('Test Product')).toBeInTheDocument()
  })
})
```

## Git Commit Messages

```
feat: Add product return feature
fix: Fix checkbox not clickable
docs: Update README with deployment guide
style: Format code with prettier
refactor: Extract common logic to hook
test: Add tests for ProductCard
chore: Update dependencies
```

## Code Review Checklist

- [ ] Code follows naming conventions
- [ ] No console.logs in production code
- [ ] Error handling implemented
- [ ] Loading states handled
- [ ] Responsive design
- [ ] Accessibility considered
- [ ] Performance optimized
- [ ] Tests written (if applicable)
- [ ] Documentation updated
- [ ] No hardcoded values
- [ ] Environment variables used correctly
