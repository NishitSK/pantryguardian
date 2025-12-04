
const { addDays } = require('date-fns')

function predict(inputs) {
  const { 
    baseShelfLifeDays, 
    roomTempShelfLifeDays, 
    fridgeShelfLifeDays, 
    freezerShelfLifeDays,
    storageMethodName,
    tempMinC, 
    tempMaxC, 
    humidityPreferred, 
    tempC, 
    humidity, 
    purchasedAt, 
    openedAt 
  } = inputs
  
  let days = baseShelfLifeDays
  const methodLower = storageMethodName.toLowerCase()
  
  // LOGIC FROM lib/prediction.ts
  if (methodLower.includes('room') && roomTempShelfLifeDays !== undefined && roomTempShelfLifeDays !== null) {
    days = roomTempShelfLifeDays
  } else if (methodLower.includes('fridge') && fridgeShelfLifeDays !== undefined && fridgeShelfLifeDays !== null) {
    days = fridgeShelfLifeDays
  } else if (methodLower.includes('freezer') && freezerShelfLifeDays !== undefined && freezerShelfLifeDays !== null) {
    days = freezerShelfLifeDays
  }
  
  console.log(`Storage: ${storageMethodName}, Base Days: ${days}`)

  let penalty = 0

  // Only apply temperature penalty for room temperature storage
  const isControlledStorage = methodLower.includes('fridge') || methodLower.includes('freezer')

  if (!isControlledStorage) {
    if (tempC < tempMinC) {
      const diff = tempMinC - tempC
      penalty += Math.min(0.5, 0.03 * diff)
    } else if (tempC > tempMaxC) {
      const diff = tempC - tempMaxC
      penalty += Math.min(0.5, 0.03 * diff)
    }
    
    const humidityDiff = Math.abs(humidity - humidityPreferred)
    penalty += Math.min(0.2, 0.003 * humidityDiff)
  }

  if (openedAt) penalty += 0.25

  console.log(`Penalty: ${penalty}`)

  const effective = Math.max(0, days * (1 - penalty))
  console.log(`Effective Days: ${effective}`)
  
  const predictedExpiry = addDays(purchasedAt, Math.round(effective))

  return predictedExpiry
}

const chicken = {
  baseShelfLifeDays: 2,
  roomTempShelfLifeDays: 0,
  fridgeShelfLifeDays: 2,
  freezerShelfLifeDays: 270,
  purchasedAt: new Date(),
  tempC: 20,
  humidity: 50
}

const roomStorage = {
  storageMethodName: 'Room Temperature',
  tempMinC: 15,
  tempMaxC: 25,
  humidityPreferred: 50
}

const fridgeStorage = {
  storageMethodName: 'Refrigerator',
  tempMinC: 0,
  tempMaxC: 4,
  humidityPreferred: 60
}

console.log('--- Testing Room Temp ---')
const resRoom = predict({ ...chicken, ...roomStorage })
console.log('Expiry:', resRoom)

console.log('\n--- Testing Fridge ---')
const resFridge = predict({ ...chicken, ...fridgeStorage })
console.log('Expiry:', resFridge)
