import { supabase } from '../lib/supabase'

export const generatePoem = async (poemRequest) => {
  console.log('Perfect Poem: poemGenerator.js received request:', poemRequest)

  const { poemType, rhymeScheme, description, lineCount, lineLength } = poemRequest

  // Prepare the payload for the Edge Function with exact parameter names
  const payload = {
    poemType: poemType || 'Free Verse',
    rhymeScheme: rhymeScheme || 'None (Free Verse)', // Added fallback to ensure non-empty value
    lineCount: lineCount || '', // Now supports custom input including numbers, ranges, or empty
    lineLength: lineLength || 'Medium',
    description: description || '',
    // Add flags to ensure strict adherence to user specifications
    strictLineCount: true, // ALWAYS enforce strict line count when provided
    strictRhymeScheme: rhymeScheme !== 'None (Free Verse)' && rhymeScheme !== 'Random (AI Chooses)' // Flag to enforce strict rhyme scheme
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

    // Verify line count if specified
    if (lineCount && !isNaN(parseInt(lineCount, 10))) {
      const expectedCount = parseInt(lineCount, 10);
      const actualCount = data.poem.split('\n').length;
      
      console.log(`Perfect Poem: Line count verification - Expected: ${expectedCount}, Actual: ${actualCount}`);
      
      if (actualCount !== expectedCount) {
        console.error(`Perfect Poem: Line count mismatch - Expected ${expectedCount}, got ${actualCount}`);
        // In production, you might want to reject this response or attempt to fix it
      }
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
  const { poemType, description, lineCount, rhymeScheme } = poemRequest
  
  // For poems with exact line count
  if (lineCount && !isNaN(parseInt(lineCount, 10))) {
    const count = parseInt(lineCount, 10);
    const lines = [];
    
    // Use varied rhyme words for demonstration
    const rhymeWords = {
      'A': ['day', 'way', 'say', 'play', 'stay', 'bay', 'ray', 'pray', 'clay', 'sway'],
      'B': ['night', 'light', 'bright', 'sight', 'might', 'flight', 'right', 'height', 'tight', 'delight'],
      'C': ['dream', 'gleam', 'stream', 'beam', 'theme', 'scheme', 'cream', 'team', 'seam', 'supreme'],
      'D': ['soul', 'goal', 'whole', 'toll', 'role', 'bowl', 'scroll', 'stroll', 'foal', 'console']
    };
    
    // Apply rhyme pattern if specified
    if (rhymeScheme && rhymeScheme !== 'None (Free Verse)' && rhymeScheme !== 'Random (AI Chooses)') {
      const pattern = rhymeScheme.replace(/[^A-F]/g, ''); // Extract just the letters
      
      for (let i = 0; i < count; i++) {
        const rhymeGroup = pattern[i % pattern.length];
        const wordIndex = i % 10; // Cycle through the words in each rhyme group
        const rhymeWord = rhymeWords[rhymeGroup] ? rhymeWords[rhymeGroup][wordIndex] : `word${i}`;
        lines.push(`Line ${i+1}: ${description} - ending with ${rhymeWord}`);
      }
    } else {
      // No specific rhyme pattern
      for (let i = 0; i < count; i++) {
        lines.push(`Line ${i+1}: ${description} - free verse line`);
      }
    }
    
    // GUARANTEE we have exactly the right number of lines
    while (lines.length > count) {
      lines.pop();
    }
    
    while (lines.length < count) {
      lines.push(`Line ${lines.length+1}: ${description} - additional line to meet exact count`);
    }
    
    return lines.join('\n');
  }
  
  // For Couplet, respect the user-specified line count if provided
  if (poemType === 'Couplet' && lineCount) {
    const count = parseInt(lineCount, 10);
    if (!isNaN(count) && count > 0) {
      const lines = [];
      
      // Use varied rhyme words for sample couplets
      const rhymeWords = [
        ['grace', 'face'],
        ['light', 'bright'],
        ['sky', 'high'],
        ['dream', 'gleam'],
        ['heart', 'start']
      ];
      
      for (let i = 0; i < count; i += 2) {
        const rhymePair = rhymeWords[Math.floor(i/2) % rhymeWords.length];
        lines.push(`In ${description} we find our ${rhymePair[0]},`);
        // If this would be the last line and we need an odd number, adjust the final line
        if (i + 1 === count - 1) {
          lines.push(`With beauty shining on love's ${rhymePair[1]}.`);
        } else if (i + 1 < count) {
          lines.push(`A gentle smile upon love's ${rhymePair[1]}.`);
        }
      }
      
      // GUARANTEE we have exactly the right number of lines
      while (lines.length > count) {
        lines.pop();
      }
      
      while (lines.length < count) {
        lines.push(`Additional line ${lines.length+1} to meet exact count of ${count}.`);
      }
      
      return lines.join('\n');
    }
  }
  
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
The ${description} returns with each new day.`,

    'Couplet': `In ${description} we find our grace,
A gentle smile upon love's face.`,

    'Ode': `O ${description}, magnificent and bright,
You fill our world with endless light!
In every moment, every day,
You show us beauty's perfect way.

Through seasons changing, time's sweet flow,
You help our weary spirits grow.
With majesty that knows no end,
You are our guide, our truest friend.

Let poets sing your praise in verse,
Let hearts with gratitude rehearse
The wonder that you bring to all,
In spring's renewal, autumn's call.

Forever may your essence shine,
O ${description}, forever thine!`
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