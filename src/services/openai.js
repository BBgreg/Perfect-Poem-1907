// OpenAI API integration - configured externally via Greta's environment
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || 'your-openai-api-key'

export const generatePoem = async (poemRequest) => {
  // For demo purposes, return a sample poem if no API key is configured
  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your-openai-api-key') {
    console.warn('OpenAI API key not configured, returning sample poem')
    return generateSamplePoem(poemRequest)
  }

  const {
    poemType,
    rhymePattern,
    description,
    lineCount,
    lineLength
  } = poemRequest

  let prompt = `Write a ${poemType} poem`
  
  if (rhymePattern) {
    prompt += ` with ${rhymePattern} rhyme scheme`
  }
  
  if (lineCount && lineCount !== 'blank') {
    prompt += ` with ${lineCount} lines`
  }
  
  if (lineLength) {
    prompt += ` using ${lineLength.toLowerCase()} lines`
  }
  
  prompt += `. Theme/Description: ${description}`
  prompt += `\n\nPlease write a beautiful, creative poem that captures the essence of the description. Make it emotionally resonant and well-crafted.`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a talented poet who creates beautiful, meaningful poems. Always respond with just the poem text, no additional commentary.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.8
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    return data.choices[0]?.message?.content?.trim()
  } catch (error) {
    console.error('Error generating poem:', error)
    console.log('Falling back to sample poem')
    return generateSamplePoem(poemRequest)
  }
}

// Sample poem generator for demo purposes
const generateSamplePoem = (poemRequest) => {
  const { poemType, description, lineLength } = poemRequest
  
  const samplePoems = {
    'Free Verse': `In the garden of thoughts where ${description} blooms,
Words dance like petals in the wind,
Each line a breath, each stanza a dream,
Painting pictures only hearts can see.

The rhythm flows like water over stones,
Smooth and gentle, yet powerful and deep,
Carrying whispers of ancient stories,
In verses that speak to the soul.`,

    'Sonnet': `When ${description} fills the morning air,
And sunlight dances through the leaves above,
The world awakens to a beauty rare,
A testament to nature's endless love.

Each moment holds a treasure to behold,
In simple things that often go unseen,
The stories that through generations told,
Of life's eternal, ever-changing scene.

So let us pause and breathe the sweet perfume,
Of ${description} that surrounds us here,
And find in every flower's gentle bloom,
A reason to hold all of life more dear.

For in these moments, fleeting though they are,
We glimpse the beauty of our guiding star.`,

    'Haiku': `${description} whispers soft—
Morning dew on petals bright,
Peace in simple things.`,

    'Limerick': `There once was a ${description} so bright,
That filled every heart with delight,
It danced through the day,
In its own special way,
And made everything feel just right.`
  }

  return samplePoems[poemType] || samplePoems['Free Verse']
}