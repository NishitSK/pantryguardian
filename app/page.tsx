import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import SectionHeading from '@/components/ui/SectionHeading'
import Card from '@/components/ui/Card'
import UrgencyBadge from '@/components/UrgencyBadge'
import { formatIndianDate } from '@/lib/dateUtils'
import LocationPromptWrapper from '@/components/LocationPromptWrapper'
import LandingPage from '@/components/LandingPage'
import RecipeSuggester from '@/components/RecipeSuggester'

export default async function Home() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    return <LandingPage />
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  })

  if (!user) {
    return <LandingPage />
  }

  // Get all items with their predictions
  const allItems = await prisma.inventoryItem.findMany({
    where: {
      userId: user.id
    },
    include: {
      product: true,
      storageMethod: true,
      predictions: {
        orderBy: {
          createdAt: 'desc'
        },
        take: 1
      }
    }
  })

  // Filter items expiring within 3 days
  const threeDaysFromNow = new Date()
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)

  const atRiskItems = allItems
    .filter(item => {
      const latestPrediction = item.predictions[0]
      if (!latestPrediction) return false
      return new Date(latestPrediction.predictedExpiry) <= threeDaysFromNow
    })
    .sort((a, b) => {
      const aExpiry = a.predictions[0]?.predictedExpiry || new Date()
      const bExpiry = b.predictions[0]?.predictedExpiry || new Date()
      return new Date(aExpiry).getTime() - new Date(bExpiry).getTime()
    })

  const totalItems = allItems.length

  // Prepare items for the recipe suggester (only need product details)
  const suggesterItems = atRiskItems.map(item => ({
    id: item.id,
    product: {
      name: item.product.name,
      category: item.product.category
    }
  }))

  // Fetch recipes from DB
  let dbRecipes = []
  try {
    // @ts-ignore
    if (prisma.recipe) {
      // @ts-ignore
      dbRecipes = await prisma.recipe.findMany({
        include: {
          ingredients: true
        }
      })
    }
  } catch (error) {
    console.error("Failed to fetch recipes:", error)
  }

  return (
    <>
      <div className="fixed inset-0 z-[-1]">
        <Image
          src="https://images.unsplash.com/photo-1495195134817-aeb325a55b65?q=80&w=1920&auto=format&fit=crop"
          alt="Background"
          fill
          className="object-cover opacity-15 dark:opacity-5"
          priority
        />
      </div>
      <LocationPromptWrapper />
      <main className="container mx-auto px-4 py-8 relative">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Welcome back, {user.name}!
          </h1>
          <p className="text-muted-foreground font-medium">
            You have {totalItems} items in your pantry
          </p>
        </div>

      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <SectionHeading className="mb-0">
            Items Requiring Attention
          </SectionHeading>
          <RecipeSuggester items={suggesterItems} dbRecipes={dbRecipes} />
        </div>
        
        {atRiskItems.length === 0 ? (
          <Card>
            <p className="text-muted-foreground">
              🎉 Great! No items expiring in the next 3 days.
            </p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {atRiskItems.map((item) => {
              const latestPrediction = item.predictions[0]
              if (!latestPrediction) return null

              const daysUntilExpiry = Math.ceil(
                (new Date(latestPrediction.predictedExpiry).getTime() - new Date().getTime()) / 
                (1000 * 60 * 60 * 24)
              )
              
              const urgencyLevel = 
                daysUntilExpiry < 0 || daysUntilExpiry === 0 ? 'red' :
                daysUntilExpiry <= 2 ? 'orange' :
                'green'
              
              return (
                <Card key={item.id}>
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-lg text-foreground">
                      {item.product.name}
                    </h3>
                    <UrgencyBadge level={urgencyLevel} />
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-medium">Quantity:</span>
                      <span className="font-semibold text-foreground">{item.quantity} {item.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-medium">Storage:</span>
                      <span className="font-semibold text-foreground">{item.storageMethod.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-medium">Expires:</span>
                      <span className="font-semibold text-foreground">
                        {formatIndianDate(new Date(latestPrediction.predictedExpiry))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-medium">Days left:</span>
                      <span className={`font-bold ${
                        daysUntilExpiry < 0 ? 'text-red-600 dark:text-red-400' : 
                        daysUntilExpiry === 0 ? 'text-orange-600 dark:text-orange-400' : 
                        'text-yellow-700 dark:text-yellow-400'
                      }`}>
                        {daysUntilExpiry < 0 ? 'Expired' : 
                         daysUntilExpiry === 0 ? 'Today' : 
                         `${daysUntilExpiry} days`}
                      </span>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </main>
    </>
  )
}