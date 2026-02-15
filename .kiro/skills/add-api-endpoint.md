# Add API Endpoint

A skill for adding new Google Sheets API endpoints.

## Usage

"Add an API endpoint to [action] [resource]"

## Steps

1. **Define the endpoint in sheetsService.js**

```javascript
// src/services/sheetsService.js

export const sheetsService = {
  // ... existing methods
  
  // New method
  async newMethod(params) {
    try {
      const range = 'SheetName!A:Z'
      const response = await fetch(
        `${config.sheetsApiBase}/${config.spreadsheetId}/values/${range}?key=${config.googleApiKey}`
      )
      
      if (!response.ok) {
        throw new Error('API request failed')
      }
      
      const data = await response.json()
      return processData(data)
    } catch (error) {
      console.error('Error in newMethod:', error)
      throw error
    }
  }
}
```

2. **Add error handling**

```javascript
try {
  const result = await sheetsService.newMethod(params)
  // Handle success
} catch (error) {
  // Handle error
  setError('เกิดข้อผิดพลาด: ' + error.message)
}
```

3. **Add loading state**

```javascript
const [loading, setLoading] = useState(false)

const fetchData = async () => {
  setLoading(true)
  try {
    const data = await sheetsService.newMethod(params)
    setData(data)
  } catch (error) {
    setError(error.message)
  } finally {
    setLoading(false)
  }
}
```

4. **Update context if needed**

```javascript
// src/contexts/SheetsContext.jsx

const SheetsContext = createContext()

export function SheetsProvider({ children }) {
  const [data, setData] = useState(null)
  
  const newMethod = async (params) => {
    const result = await sheetsService.newMethod(params)
    setData(result)
    return result
  }
  
  return (
    <SheetsContext.Provider value={{ data, newMethod }}>
      {children}
    </SheetsContext.Provider>
  )
}
```

5. **Use in component**

```javascript
import { useSheets } from '../contexts/SheetsContext'

function MyComponent() {
  const { newMethod } = useSheets()
  
  const handleAction = async () => {
    try {
      await newMethod(params)
      // Success
    } catch (error) {
      // Error
    }
  }
  
  return <button onClick={handleAction}>Action</button>
}
```

## Common Patterns

### Read Data
```javascript
async getProducts() {
  const range = 'Products!A2:I'
  const response = await fetch(
    `${config.sheetsApiBase}/${config.spreadsheetId}/values/${range}?key=${config.googleApiKey}`
  )
  const data = await response.json()
  return data.values.map(rowToProduct)
}
```

### Write Data
```javascript
async addProduct(product) {
  const range = 'Products!A:I'
  const values = [productToRow(product)]
  
  const response = await fetch(
    `${config.sheetsApiBase}/${config.spreadsheetId}/values/${range}:append?valueInputOption=RAW&key=${config.googleApiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ values })
    }
  )
  
  return await response.json()
}
```

### Update Data
```javascript
async updateProduct(code, updates) {
  // Find row index
  const products = await this.getProducts()
  const index = products.findIndex(p => p.code === code)
  
  // Update specific range
  const range = `Products!A${index + 2}:I${index + 2}`
  const values = [productToRow({ ...products[index], ...updates })]
  
  const response = await fetch(
    `${config.sheetsApiBase}/${config.spreadsheetId}/values/${range}?valueInputOption=RAW&key=${config.googleApiKey}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ values })
    }
  )
  
  return await response.json()
}
```

### Batch Operations
```javascript
async batchUpdate(updates) {
  const response = await fetch(
    `${config.sheetsApiBase}/${config.spreadsheetId}/values:batchUpdate?key=${config.googleApiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        valueInputOption: 'RAW',
        data: updates
      })
    }
  )
  
  return await response.json()
}
```
