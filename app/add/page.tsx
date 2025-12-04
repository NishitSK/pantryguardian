'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts'
import Card from '@/components/ui/Card'
import { Button } from '@/components/ui/button'
import SectionHeading from '@/components/ui/SectionHeading'
import CustomSelect, { SelectOption } from '@/components/ui/CustomSelect'
import LoadingFruit from '@/components/ui/loading-fruit'
import { formatIndianDate } from '@/lib/dateUtils'
import { getApiBaseUrl } from '@/lib/api'

type Product = {
  id: string
  name: string
  category: string
  baseShelfLifeDays: number
  roomTempShelfLifeDays: number | null
  fridgeShelfLifeDays: number | null
  freezerShelfLifeDays: number | null
  storageNotes: string | null
  defaultStorageMethodId: string
}

type StorageMethod = {
  id: string
  name: string
  tempRangeMinC: number
  tempRangeMaxC: number
  humidityPreferred: number
}

const getCategoryIcon = (category: string) => {
  const map: Record<string, string> = {
    'Bakery': '🥖',
    'Beverages': '🥤',
    'Condiments & Sauces': '🥫',
    'Dairy': '🥛',
    'Eggs & Tofu': '🥚',
    'Fresh Fruits': '🍎',
    'Fresh Vegetables': '🥦',
    'Frozen Foods': '❄️',
    'Meat & Poultry': '🥩',
    'Pantry Staples': '🍚',
    'Seafood': '🐟',
    'Snacks': '🍿',
    'Grains & Pasta': '🍝',
    'Canned Goods': '🥫',
    'Breakfast': '🥣',
    'Herbs & Spices': '🌿'
  }
  return map[category] || '📦'
}

export default function AddItemPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [storageMethods, setStorageMethods] = useState<StorageMethod[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedProductId, setSelectedProductId] = useState('')
  const [selectedStorageId, setSelectedStorageId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [unit, setUnit] = useState('pieces')
  const [purchasedAt, setPurchasedAt] = useState(new Date().toISOString().split('T')[0])
  const [openedAt, setOpenedAt] = useState('')
  const [notes, setNotes] = useState('')

  // Prediction preview state
  const [predictedExpiry, setPredictedExpiry] = useState<Date | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (selectedProductId && selectedStorageId && purchasedAt) {
      calculatePrediction()
    }
  }, [selectedProductId, selectedStorageId, purchasedAt, openedAt])

  const fetchData = async () => {
    try {
      const baseUrl = getApiBaseUrl()
      const [productsRes, storageRes] = await Promise.all([
        fetch(`${baseUrl}/api/products`),
        fetch(`${baseUrl}/api/storage-methods`)
      ])

      if (!productsRes.ok || !storageRes.ok) {
        throw new Error('Failed to fetch data')
      }

      const productsData = await productsRes.json()
      const storageData = await storageRes.json()

      setProducts(productsData)
      setStorageMethods(storageData)

      // Extract unique categories
      const categorySet = new Set<string>(productsData.map((p: Product) => p.category))
      const uniqueCategories = Array.from(categorySet).sort()
      setCategories(uniqueCategories)

      setLoading(false)
    } catch (err) {
      setError('Failed to load data')
      setLoading(false)
    }
  }

  const calculatePrediction = () => {
    const product = products.find(p => p.id === selectedProductId)
    const storage = storageMethods.find(s => s.id === selectedStorageId)

    if (!product || !storage) return

    // Determine shelf life based on storage method
    let shelfLifeDays = product.baseShelfLifeDays
    const methodLower = storage.name.toLowerCase()

    if (methodLower.includes('room') && product.roomTempShelfLifeDays !== null) {
      shelfLifeDays = product.roomTempShelfLifeDays
    } else if ((methodLower.includes('fridge') || methodLower.includes('refrig')) && product.fridgeShelfLifeDays !== null) {
      shelfLifeDays = product.fridgeShelfLifeDays
    } else if (methodLower.includes('freezer') && product.freezerShelfLifeDays !== null) {
      shelfLifeDays = product.freezerShelfLifeDays
    }

    // Apply penalty if opened
    let effectiveDays = shelfLifeDays
    if (openedAt) {
      effectiveDays = Math.round(shelfLifeDays * 0.75) // 25% reduction if opened
    }

    const purchased = new Date(purchasedAt)
    const expiry = new Date(purchased)
    expiry.setDate(expiry.getDate() + effectiveDays)
    setPredictedExpiry(expiry)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const baseUrl = getApiBaseUrl()
      const response = await fetch(`${baseUrl}/api/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProductId,
          storageMethodId: selectedStorageId,
          quantity: parseFloat(quantity),
          unit,
          purchasedAt,
          openedAt: openedAt || null,
          notes: notes || null
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to add item')
      }

      router.push('/inventory')
    } catch (err: any) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  const filteredProducts = selectedCategory
    ? products.filter(p => p.category === selectedCategory)
    : products

  const selectedProduct = products.find(p => p.id === selectedProductId)

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-8 min-h-[60vh] flex items-center justify-center">
        <LoadingFruit />
      </main>
    )
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <SectionHeading>Add New Item</SectionHeading>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Add groceries to your inventory with smart expiry predictions</p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <CustomSelect
                  value={selectedCategory}
                  onChange={(val) => {
                    setSelectedCategory(val)
                    setSelectedProductId('')
                  }}
                  options={categories.map(cat => ({
                    label: cat,
                    value: cat,
                    icon: getCategoryIcon(cat)
                  }))}
                  placeholder="Select a category"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Product
                </label>
                <CustomSelect
                  value={selectedProductId}
                  onChange={(val) => setSelectedProductId(val)}
                  disabled={!selectedCategory}
                  options={filteredProducts.map(product => ({
                    label: product.name,
                    value: product.id
                  }))}
                  placeholder="Select a product"
                />
              </div>

              {selectedProduct?.storageNotes && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    💡 <span className="font-medium">Storage Tip:</span> {selectedProduct.storageNotes}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Storage Method
                </label>
                <CustomSelect
                  value={selectedStorageId}
                  onChange={(val) => setSelectedStorageId(val)}
                  options={storageMethods.map(method => ({
                    label: method.name,
                    value: method.id,
                    icon: method.name.toLowerCase().includes('fridge') ? '❄️' : 
                          method.name.toLowerCase().includes('freezer') ? '🧊' : '🏠'
                  }))}
                  placeholder="Select storage method"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Quantity
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Unit
                  </label>
                  <CustomSelect
                    value={unit}
                    onChange={(val) => setUnit(val)}
                    options={[
                      { label: 'Pieces', value: 'pieces' },
                      { label: 'Kg', value: 'kg' },
                      { label: 'Grams', value: 'g' },
                      { label: 'Liters', value: 'L' },
                      { label: 'mL', value: 'mL' },
                      { label: 'Pounds', value: 'lbs' },
                      { label: 'Ounces', value: 'oz' },
                      { label: 'Packages', value: 'packages' }
                    ]}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    value={purchasedAt}
                    onChange={(e) => setPurchasedAt(e.target.value)}
                    required
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Opened Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={openedAt}
                    onChange={(e) => setOpenedAt(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Add any additional notes..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Adding...' : 'Add to Inventory'}
                </Button>
                <Button
                  type="button"
                  onClick={() => router.push('/inventory')}
                  className="bg-gray-500 hover:bg-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>

        <div>
          <Card>
            <h3 className="font-semibold text-lg mb-4 text-gray-900 dark:text-white">Prediction Preview</h3>
            
            {predictedExpiry ? (
              <div className="space-y-6">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Predicted Expiry</p>
                  <p className="text-3xl font-bold text-green-700 dark:text-green-400">
                    {formatIndianDate(predictedExpiry)}
                  </p>
                  <p className="text-sm font-medium text-green-600 dark:text-green-300 mt-1">
                    {Math.ceil((predictedExpiry.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left
                  </p>
                </div>

                {/* Storage Comparison Chart */}
                {selectedProduct && (
                  <div className="h-48 w-full">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Storage Method Comparison</p>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { name: 'Pantry', days: selectedProduct.roomTempShelfLifeDays || 0, color: '#f97316' },
                          { name: 'Fridge', days: selectedProduct.fridgeShelfLifeDays || 0, color: '#3b82f6' },
                          { name: 'Freezer', days: selectedProduct.freezerShelfLifeDays || 0, color: '#6366f1' },
                        ].filter(d => d.days > 0)}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                      >
                        <XAxis type="number" hide />
                        <YAxis 
                          type="category" 
                          dataKey="name" 
                          tick={{ fontSize: 12, fill: 'currentColor' }} 
                          width={50}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip 
                          cursor={{ fill: 'transparent' }}
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                            borderRadius: '8px', 
                            border: 'none', 
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' 
                          }}
                        />
                        <Bar dataKey="days" radius={[0, 4, 4, 0]} barSize={20}>
                          {
                            [
                              { name: 'Pantry', days: selectedProduct.roomTempShelfLifeDays || 0, color: '#f97316' },
                              { name: 'Fridge', days: selectedProduct.fridgeShelfLifeDays || 0, color: '#3b82f6' },
                              { name: 'Freezer', days: selectedProduct.freezerShelfLifeDays || 0, color: '#6366f1' },
                            ].filter(d => d.days > 0).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))
                          }
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Model Confidence</p>
                    <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="absolute top-0 left-0 h-full bg-green-500 w-[85%]"></div>
                    </div>
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mt-1">85%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Model Version</p>
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mt-2">rb-1.1</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center p-6 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                <span className="text-4xl mb-3">🔮</span>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Select a product and storage method to see the AI prediction and storage comparison.
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </main>
  )
}
