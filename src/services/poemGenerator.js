import { supabase } from '../lib/supabase'

export const generatePoem = async (poemRequest) => {
  console.log('Perfect Poem: poemGenerator.js received request:', poemRequest)

  const { poemType, rhymeScheme, description, lineCount, lineLength } = poemRequest

  // Prepare the payload for the Edge Function with exact parameter names
  const payload = {
    poemType: poemType || 'Free Verse',
    rhymeScheme: rhymeScheme || 'None (Free Verse)', // Added fallback to ensure non-empty value
    lineCount: lineCount === 'blank' ? '' : (lineCount || ''),
    lineLength: lineLength || 'Medium',
    description: description || ''
  }

  // Final safety check - ensure rhymeScheme is never empty
  if (!payload.rhymeScheme || payload.rhymeScheme === '') {
    console.log('Perfect Poem: Empty rhymeScheme detected in service layer, using fallback')
    payload.rhymeScheme = 'None (Free Verse)'
  }

  console.log('Perfect Poem: poemGenerator.js final payload before Edge Function call:', payload)
  console.log('Perfect Poem: poemGenerator.js payload JSON:', JSON.stringify(payload, null, 2))

  try {
    console.log('Perfect Poem: Calling Supabase Edge Function with payload:', payload)
    
    // Call the generate-poem-ts Edge Function with the correct URL
    const { data, error } = await supabase.functions.invoke('generate-poem-ts', {
      body: payload
    })

    console.log('Perfect Poem: Edge Function response:', { data, error })

    if (error) {
      console.error('Perfect Poem: Edge Function error:', error)
      
      // Handle specific error types
      if (error.message?.includes('404') || error.message?.includes('Not Found')) {
        throw new Error('The poem generation service is currently unavailable. Please try again later.')
      } else if (error.message?.includes('CORS') || error.message?.includes('cross-origin')) {
        throw new Error('There was a connection issue with the poem generation service. Please refresh the page and try again.')
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        throw new Error('Unable to connect to the poem generation service. Please check your internet connection and try again.')
      } else if (error.message?.includes('400') || error.message?.includes('Bad Request')) {
        console.error('Perfect Poem: 400 Bad Request - Payload may be malformed:', payload)
        throw new Error('There was an issue with the poem request. Please check all fields and try again.')
      } else {
        throw new Error(`Poem generation service error: ${error.message || 'Unknown error occurred'}`)
      }
    }

    if (!data || !data.poem) {
      console.error('Perfect Poem: Invalid response from Edge Function:', data)
      throw new Error('The poem generation service returned an unexpected response. Please try again.')
    }

    console.log('Perfect Poem: Successfully generated poem via Edge Function')
    return data.poem

  } catch (error) {
    console.error('Perfect Poem: Error calling generate-poem-ts Edge Function:', error)
    
    // If it's already a user-friendly error, re-throw it
    if (error.message && (
      error.message.includes('poem generation service') || 
      error.message.includes('connection issue') || 
      error.message.includes('internet connection') ||
      error.message.includes('poem request')
    )) {
      throw error
    }
    
    // Handle other types of errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Unable to connect to the poem generation service. Please check your internet connection and try again.')
    } else if (error.message && error.message.includes('404')) {
      throw new Error('The poem generation service is currently unavailable. Please try again later.')
    } else if (error.message && error.message.includes('CORS')) {
      throw new Error('There was a connection issue with the poem generation service. Please refresh the page and try again.')
    } else if (error.message && error.message.includes('400')) {
      console.error('Perfect Poem: 400 Bad Request - Full error:', error)
      throw new Error('There was an issue with the poem request format. Please try again.')
    } else {
      throw new Error('An unexpected error occurred while generating your poem. Please try again.')
    }
  }
}

// Enhanced fallback function for development/testing
export const generateSamplePoem = (poemRequest) => {
  const { poemType, description } = poemRequest
  
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
And made everything feel just right.`,

    'Ballad': `Oh, tell me the tale of ${description},
That dances in moonlight so fair,
With stories of old and of new,
And magic that floats in the air.

The wind carries whispers of wonder,
Through valleys and over the hill,
Where ${description} waits in the silence,
And time itself seems to stand still.`,

    'Acrostic': generateAcrosticPoem(description),

    'Cinquain': `${description}
Beautiful, serene
Dancing, flowing, singing
Bringing joy to all who see
Wonder.`,

    'Villanelle': `The ${description} returns with each new day,
Through seasons of change and of rest,
In patterns that never decay.

Though time may seem to slip away,
The ${description} remains our guest,
The ${description} returns with each new day.

In moments when we pause to pray,
We find the ${description} at its best,
In patterns that never decay.

The ${description} shows us how to play,
And puts our weary hearts to test,
The ${description} returns with each new day.

So let us not forget the way
The ${description} makes us blessed,
In patterns that never decay.
The ${description} returns with each new day.`
  }

  return samplePoems[poemType] || samplePoems['Free Verse']
}

// Helper function for acrostic poems
function generateAcrosticPoem(description) {
  const word = description.split(' ')[0].toUpperCase()
  const lines = []
  
  for (let i = 0; i < Math.min(word.length, 8); i++) {
    const letter = word[i]
    const lineStarters = {
      'A': 'Amazing wonders fill the air',
      'B': 'Beautiful moments everywhere',
      'C': 'Cascading light through morning dew',
      'D': 'Dancing shadows, ever new',
      'E': 'Endless stories to be told',
      'F': 'Flowing gently, brave and bold',
      'G': 'Graceful movements in the breeze',
      'H': 'Harmonious melodies with ease',
      'I': 'Inspiring hearts with gentle care',
      'J': 'Joyful laughter fills the air',
      'K': 'Kindness blooms in every space',
      'L': 'Love surrounds this sacred place',
      'M': 'Magical moments come to life',
      'N': 'Nature heals all pain and strife',
      'O': 'Overflowing with pure delight',
      'P': 'Peaceful visions, clear and bright',
      'Q': 'Quietly whispering ancient lore',
      'R': 'Radiant beauty to explore',
      'S': 'Serenity flows like a stream',
      'T': 'Timeless wonder, like a dream',
      'U': 'Unfolding mysteries divine',
      'V': 'Vibrant colors intertwine',
      'W': 'Whispers of the wind so free',
      'X': 'eXtraordinary things we see',
      'Y': 'Yearning hearts find peace at last',
      'Z': 'Zestful joy that is unsurpassed'
    }
    
    lines.push(lineStarters[letter] || `${letter}onders never cease to amaze`)
  }
  
  return lines.join('\n')
}