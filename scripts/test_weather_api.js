const apiKey = "7f2cc4799a7f2199aa43a90578920042";
const city = "London";

async function testWeather() {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`;
  console.log("Fetching:", url);
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log("Data:", JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Error:", e);
  }
}

testWeather();
