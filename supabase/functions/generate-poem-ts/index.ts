// This is a mock of what the Edge Function would look like 
// Actual implementation would be deployed to Supabase

import { serve } from 'https://deno.land/std@0.131.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Configuration, OpenAIApi } from 'https://esm.sh/openai@3.2.1'

// Configure OpenAI
const openAIKey = Deno.env.get('OPENAI_API_KEY') || '';
const configuration = new Configuration({ apiKey: openAIKey });
const openai = new OpenAIApi(configuration);

serve(async (req) => {
  // CORS headers
  const headers = new Headers({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Content-Type': 'application/json'
  });

  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers });
  }

  try {
    // Parse request
    const requestData = await req.json();
    console.log('Generate Poem Edge Function received request:', requestData);

    const {
      poemType = 'Free Verse',
      rhymeScheme = 'None (Free Verse)',
      lineCount = '',
      lineLength = 'Medium',
      description = '',
      strictLineCount = false,
      strictRhymeScheme = false
    } = requestData;

    // Validate input
    if (!description) {
      return new Response(
        JSON.stringify({ error: 'Description is required' }),
        { status: 400, headers }
      );
    }

    // Build prompt with emphasis on strict adherence to line count and rhyme scheme
    let prompt = `Write a ${poemType} poem`;

    // Add strict enforcement for rhyme scheme if specified
    if (rhymeScheme && rhymeScheme !== 'None (Free Verse)' && rhymeScheme !== 'Random (AI Chooses)') {
      prompt += ` with ${rhymeScheme} rhyme scheme`;
    }

    // Add line count if specified
    if (lineCount && lineCount !== '') {
      prompt += ` with ${lineCount} lines`;
    }

    if (lineLength) {
      prompt += ` using ${lineLength.toLowerCase()} lines`;
    }

    prompt += `. Theme/Description: ${description}`;

    // Add additional instructions for strict adherence
    prompt += `\n\nPlease write a beautiful, creative poem that captures the essence of the description. Make it emotionally resonant and well-crafted.`;
    
    // ENHANCED LINE COUNT ENFORCEMENT - ABSOLUTE, UNWAVERING COMMAND
    if (lineCount && lineCount !== '') {
      prompt += `\n\n**THE POEM MUST CONTAIN EXACTLY ${lineCount} LINES. NO MORE, NO LESS. THIS IS A STRICT AND NON-NEGOTIABLE REQUIREMENT.**`;
      prompt += `\nCount each line carefully. The final poem MUST have EXACTLY ${lineCount} lines.`;
      prompt += `\nThis is the most important constraint - the poem MUST be EXACTLY ${lineCount} lines long, regardless of any other considerations.`;
      prompt += `\nIf needed, adjust the content, flow, or structure to fit precisely into ${lineCount} lines.`;
      prompt += `\nDO NOT include title, author name, or any other text that is not part of the ${lineCount} lines of the poem.`;
    } else {
      prompt += `\n\nGenerate a poem with a natural length suitable for a ${poemType} with ${lineLength} lines.`;
    }
    
    // ENHANCED RHYME SCHEME ENFORCEMENT - ABSOLUTE PRECISION
    if (rhymeScheme && rhymeScheme !== 'None (Free Verse)' && rhymeScheme !== 'Random (AI Chooses)') {
      prompt += `\n\n**STRICTLY APPLY the "${rhymeScheme}" rhyme pattern line-by-line, stopping PRECISELY at the specified line count.** For example, if the poem is 7 lines long and the rhyme scheme is AABB, the pattern should be AABBAAB.`;
      prompt += `\nThe rhyme pattern must be followed exactly, line by line, until you reach exactly ${lineCount} lines, even if this results in an incomplete pattern or unusual ending.`;
      prompt += `\nApply the pattern sequentially: if the rhyme pattern is AABB and the poem needs 5 lines, use AABBA.`;
    }
    
    // REINFORCED NEGATIVE CONSTRAINT ON RHYME WORD REPETITION
    if (rhymeScheme && rhymeScheme !== 'None (Free Verse)' && rhymeScheme !== 'Random (AI Chooses)') {
      prompt += `\n\n**IMPORTANT: DO NOT repeat the exact same word at the end of different rhyming lines.** Each rhyme should use different words with similar sounds (e.g., 'light'/'bright', not 'light'/'light').`;
      prompt += `\nThe only exception is if the poem's structure (like a Villanelle) explicitly requires repeating entire lines as refrains.`;
      prompt += `\nStrive for diverse and creative rhyming words throughout the poem.`;
    }
    
    // FINAL VERIFICATION INSTRUCTION
    if (lineCount && lineCount !== '') {
      prompt += `\n\nBefore finalizing the poem, COUNT THE LINES ONE BY ONE and verify that the total is EXACTLY ${lineCount} lines. If it's not exactly ${lineCount} lines, revise immediately.`;
    }

    console.log('Generate Poem Edge Function sending prompt to OpenAI:', prompt);

    // For this mock, we'll return sample poems since we can't actually call OpenAI
    // In a real implementation, this would call the OpenAI API
    const poem = generateSamplePoem(poemType, description, lineCount, rhymeScheme);
    
    console.log('Generate Poem Edge Function returning poem');
    return new Response(
      JSON.stringify({ poem }),
      { status: 200, headers }
    );

  } catch (error) {
    console.error('Error in generate-poem-ts Edge Function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An unexpected error occurred' }),
      { status: 500, headers }
    );
  }
});

// Sample poem generator for demonstration
function generateSamplePoem(poemType: string, description: string, lineCount?: string, rhymeScheme?: string): string {
  // For poems with exact line count
  if (lineCount && !isNaN(parseInt(lineCount, 10))) {
    const count = parseInt(lineCount, 10);
    // Generate a poem with exactly the specified number of lines
    const lines = [];
    
    // Use varied rhyme words for demonstration
    const rhymeWords = {
      'A': ['day', 'way', 'say', 'play', 'stay', 'bay', 'ray', 'pray', 'clay', 'sway'],
      'B': ['night', 'light', 'bright', 'sight', 'might', 'flight', 'right', 'height', 'tight', 'delight'],
      'C': ['dream', 'gleam', 'stream', 'beam', 'theme', 'scheme', 'cream', 'team', 'seam', 'supreme'],
      'D': ['soul', 'goal', 'whole', 'toll', 'role', 'bowl', 'scroll', 'stroll', 'foal', 'console'],
      'E': ['mind', 'find', 'kind', 'blind', 'lined', 'signed', 'bind', 'wind', 'designed', 'refined'],
      'F': ['heart', 'start', 'part', 'art', 'chart', 'smart', 'cart', 'dart', 'impart', 'depart']
    };
    
    // Apply rhyme pattern if specified
    if (rhymeScheme && rhymeScheme !== 'None (Free Verse)' && rhymeScheme !== 'Random (AI Chooses)') {
      const pattern = rhymeScheme.replace(/[^A-F]/g, ''); // Extract just the letters
      
      for (let i = 0; i < count; i++) {
        const rhymeGroup = pattern[i % pattern.length];
        const wordIndex = i % 10; // Cycle through the words in each rhyme group
        const rhymeWord = rhymeWords[rhymeGroup][wordIndex];
        lines.push(`Line ${i+1}: ${description} - ending with ${rhymeWord}`);
      }
    } else {
      // No specific rhyme pattern
      for (let i = 0; i < count; i++) {
        lines.push(`Line ${i+1}: ${description} - free verse line`);
      }
    }
    
    // Ensure EXACTLY the requested number of lines
    while (lines.length > count) {
      lines.pop();
    }
    
    while (lines.length < count) {
      lines.push(`Line ${lines.length+1}: ${description} - additional line to meet exact count`);
    }
    
    return lines.join('\n');
  }
  
  // Default samples for different poem types (with exact line counts for structured forms)
  const samplePoems: Record<string, string> = {
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
  };

  return samplePoems[poemType] || samplePoems['Free Verse'];
}