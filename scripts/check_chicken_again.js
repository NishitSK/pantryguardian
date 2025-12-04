
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const product = await prisma.product.findFirst({
    where: { name: 'Chicken Breast' }
  })
  console.log('Chicken Breast:', product)
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
