# Create React Component

A skill for creating new React components following project standards.

## Usage

"Create a component called [ComponentName] that [description]"

## Template

```jsx
import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import './ComponentName.css'

function ComponentName({ prop1, prop2 }) {
  // State
  const [state, setState] = useState(initialValue)
  
  // Effects
  useEffect(() => {
    // Effect logic
  }, [])
  
  // Handlers
  const handleAction = () => {
    // Handler logic
  }
  
  // Render
  return (
    <div className="component-name">
      {/* Component content */}
    </div>
  )
}

ComponentName.propTypes = {
  prop1: PropTypes.string.isRequired,
  prop2: PropTypes.func
}

ComponentName.defaultProps = {
  prop2: () => {}
}

export default ComponentName
```

## Steps

1. Create component file in appropriate directory:
   - `src/components/` for reusable components
   - `src/pages/` for page components
   
2. Create corresponding CSS file if needed

3. Follow naming conventions:
   - PascalCase for component name
   - kebab-case for CSS class names
   
4. Add PropTypes for type checking

5. Export component as default

6. Import and use in parent component
