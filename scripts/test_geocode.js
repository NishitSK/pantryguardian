const apiKey = "7f2cc4799a7f2199aa43a90578920042";
const city = "Mumbai";

async function testGeocode() {
  const url = `https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${apiKey}`;
  console.log("Fetching Geocode:", url);
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log("Geocode Data:", JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Error:", e);
  }
}

testGeocode();
