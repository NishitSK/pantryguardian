import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import SectionHeading from '@/components/ui/SectionHeading'
import InventoryList from '@/components/InventoryList'

export default async function InventoryPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    redirect('/auth/login')
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  })

  if (!user) {
    redirect('/auth/login')
  }

  const items = await prisma.inventoryItem.findMany({
    where: { userId: user.id },
    include: {
      product: true,
      storageMethod: true,
      predictions: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    },
    orderBy: { createdAt: 'desc' }
  })

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
      <main className="container mx-auto px-4 py-8 relative">
        <div className="mb-8">
        <SectionHeading>My Inventory</SectionHeading>
        <p className="text-gray-700 dark:text-gray-300 font-medium mt-2">
          You have {items.length} {items.length === 1 ? 'item' : 'items'} in your pantry
        </p>
      </div>

      <InventoryList initialItems={items} />
      </main>
    </>
  )
}
