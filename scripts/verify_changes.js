
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const itemsToCheck = ['Quail Eggs', 'Coconut Water', 'Chicken Breast', 'Milk']
  
  console.log('--- Verifying Database Values ---')
  
  for (const name of itemsToCheck) {
    const product = await prisma.product.findFirst({
      where: { name }
    })
    
    if (product) {
      console.log(`\nProduct: ${product.name}`)
      console.log(`- Room Temp Shelf Life: ${product.roomTempShelfLifeDays} days`)
      console.log(`- Fridge Shelf Life: ${product.fridgeShelfLifeDays} days`)
    } else {
      console.log(`\nProduct ${name} not found!`)
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
