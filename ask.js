const fs = require('fs');

async function askAboutCode(filePath, question) {
  // 1. File path check
  if (!fs.existsSync(filePath)) {
    console.error("❌ File khuje paoya jayni!");
    return;
  }

  const code = fs.readFileSync(filePath, 'utf-8');
  
  console.log("⏳ AI 'chinta' korche (AVX chhara ektu shomoy lagte pare)...");

  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen2.5:0.5b',
        prompt: `System: You are a minimalist UI expert. Use Tailwind CSS.\nCode:\n${code}\n\nTask: ${question}`,
        stream: false,
        options: {
          num_ctx: 2048, // Context window choto rakhun jate VPS-e pressure kom pore
          temperature: 0.2 // Results accurate rakhar jonno
        }
      })
    });
    
    const data = await response.json();
    console.log("\n--- AI Response ---");
    console.log(data.response);
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

// Apnar page.tsx path thik thakle eta cholbe
askAboutCode('./src/app/page.tsx', 'Make this layout more compact by removing extra padding and white space.');
