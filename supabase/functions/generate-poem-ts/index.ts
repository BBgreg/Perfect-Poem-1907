// This is a mock of what the Edge Function would look like 
// Actual implementation would be deployed to Supabase
import { serve } from 'https://deno.land/std@0.131.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Configuration, OpenAIApi } from 'https://esm.sh/openai@3.2.1' 

// Configure OpenAI 
const openAIKey = Deno.env.get('OPENAI_API_KEY') || '';
const configuration = new Configuration({
  apiKey: openAIKey
});
const openai = new OpenAIApi(configuration);

serve(async (req) => {
  // CORS headers 
  const headers = new Headers({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization,x-client-info,apikey,content-type',
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

    // Add basic line length instruction
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

    // ENHANCED LINE LENGTH ENFORCEMENT - PRECISE WORD COUNT RANGES
    if (lineLength === 'Short') {
      prompt += `\n\n**EACH INDIVIDUAL LINE OF THE POEM MUST BE SHORT AND CONCISE, TYPICALLY 3-6 WORDS PER LINE.**`;
      prompt += `\nEnsure every line is brief, impactful, and contains approximately 3-6 words.`;
      prompt += `\nUse concise phrasing and prioritize brevity in each line.`;
      prompt += `\nEven if this requires restructuring thoughts or breaking up longer sentences.`;
      prompt += `\nThis constraint on individual line length is extremely important and must be followed for ALL lines.`;
    } else if (lineLength === 'Medium') {
      prompt += `\n\n**EACH INDIVIDUAL LINE OF THE POEM MUST BE OF MEDIUM LENGTH, TYPICALLY 7-12 WORDS PER LINE.**`;
      prompt += `\nEnsure every line contains approximately 7-12 words for a natural, conversational flow.`;
      prompt += `\nThis is the standard length that balances detail with readability.`;
      prompt += `\nAdjust phrasing as needed to maintain this medium length consistently throughout the poem.`;
      prompt += `\nThis constraint on individual line length is extremely important and must be followed for ALL lines.`;
    } else if (lineLength === 'Long') {
      prompt += `\n\n**EACH INDIVIDUAL LINE OF THE POEM MUST BE SIGNIFICANTLY LONG, TYPICALLY 13-20+ WORDS PER LINE.**`;
      prompt += `\nEnsure every line is expansive and contains approximately 13-20+ words.`;
      prompt += `\nUse detailed descriptions, flowing clauses, and rich language in each line.`;
      prompt += `\nCreate sweeping, elaborate phrases that extend across the entire line.`;
      prompt += `\nThis constraint on individual line length is extremely important and must be followed for ALL lines.`;
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

    // FINAL VERIFICATION INSTRUCTION - CHECK BOTH LINE COUNT AND LINE LENGTH
    if (lineCount && lineCount !== '') {
      prompt += `\n\nBefore finalizing the poem, COUNT THE LINES ONE BY ONE and verify that the total is EXACTLY ${lineCount} lines. If it's not exactly ${lineCount} lines, revise immediately.`;
    }
    
    // Add final verification for line length
    prompt += `\n\nBefore finalizing, VERIFY THAT EACH LINE FOLLOWS THE ${lineLength.toUpperCase()} LINE LENGTH REQUIREMENT as specified above. Count words in each line to ensure compliance.`;

    console.log('Generate Poem Edge Function sending prompt to OpenAI:', prompt);

    // For this mock, we'll return sample poems since we can't actually call OpenAI 
    // In a real implementation, this would call the OpenAI API 
    const poem = generateSamplePoem(poemType, description, lineCount, rhymeScheme, lineLength);
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
function generateSamplePoem(
  poemType: string, 
  description: string, 
  lineCount?: string, 
  rhymeScheme?: string,
  lineLength: string = 'Medium'
): string {
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

    // Define templates based on line length
    const shortTemplates = [
      "Stars light the night.",
      "Dreams fill our minds.",
      "Hope never fades away.",
      "Love conquers all fears.",
      "Time slips through fingers.",
      "Words create new worlds."
    ];

    const mediumTemplates = [
      "The gentle rain falls softly on the quiet evening streets.",
      "Memories of childhood summers dance through my waking dreams.",
      "Your laughter echoes through the hallways of my lonely heart.",
      "The mountains stand tall against the backdrop of azure skies.",
      "Whispers of ancient wisdom flow through the rustling leaves.",
      "Shadows lengthen as the sun begins its descent into twilight."
    ];

    const longTemplates = [
      "The amber light of sunset cascades across the valley, painting everything in hues of gold and crimson as day surrenders to night.",
      "Beneath the canopy of stars that stretches endlessly above, we contemplate our place in this vast universe of infinite possibilities.",
      "Memories of summers long past drift through my consciousness like dandelion seeds carried on a warm afternoon breeze, delicate and fleeting.",
      "The ancient oak that stands sentinel at the edge of the meadow has witnessed centuries of human joy and sorrow with silent understanding.",
      "When darkness threatens to overwhelm the spirit with its heavy mantle of doubt and fear, hope emerges like the first light of dawn.",
      "The symphony of existence plays on in magnificent complexity, each life adding its unique melody to the grand composition of time."
    ];

    // Select template array based on lineLength
    let templates = mediumTemplates;
    if (lineLength === 'Short') {
      templates = shortTemplates;
    } else if (lineLength === 'Long') {
      templates = longTemplates;
    }

    // Apply rhyme pattern if specified 
    if (rhymeScheme && rhymeScheme !== 'None (Free Verse)' && rhymeScheme !== 'Random (AI Chooses)') {
      const pattern = rhymeScheme.replace(/[^A-F]/g, ''); // Extract just the letters 
      
      for (let i = 0; i < count; i++) {
        const rhymeGroup = pattern[i % pattern.length];
        const wordIndex = i % 10; // Cycle through the words in each rhyme group 
        const rhymeWord = rhymeWords[rhymeGroup][wordIndex];
        
        // Get a template and modify it to end with the rhyme word
        const template = templates[i % templates.length];
        
        if (lineLength === 'Short') {
          lines.push(`${description} ${rhymeWord}.`);
        } else if (lineLength === 'Medium') {
          lines.push(`The ${description} brings thoughts of wonder and ${rhymeWord}.`);
        } else { // Long
          lines.push(`When contemplating the profound nature of ${description}, my mind wanders through landscapes of imagination until finding ${rhymeWord}.`);
        }
      }
    } else {
      // No specific rhyme pattern 
      for (let i = 0; i < count; i++) {
        // Use templates directly for non-rhyming poems
        const template = templates[i % templates.length];
        
        if (lineLength === 'Short') {
          // 3-6 words
          lines.push(template.replace(/\w+/g, (match) => Math.random() > 0.7 ? description : match).slice(0, 30));
        } else if (lineLength === 'Medium') {
          // 7-12 words
          lines.push(template.replace(/\w+/g, (match) => Math.random() > 0.8 ? description : match));
        } else { // Long
          // 13-20+ words
          lines.push(template.replace(/\w+/g, (match) => Math.random() > 0.9 ? description : match));
        }
      }
    }
    
    // Ensure EXACTLY the requested number of lines 
    while (lines.length > count) {
      lines.pop();
    }
    
    while (lines.length < count) {
      if (lineLength === 'Short') {
        lines.push(`${description} shines bright.`);
      } else if (lineLength === 'Medium') {
        lines.push(`The beauty of ${description} fills our hearts with wonder.`);
      } else { // Long
        lines.push(`When we contemplate the profound significance of ${description} in our lives, we discover new dimensions of understanding and appreciation.`);
      }
    }
    
    return lines.join('\n');
  }

  // Create line length examples for the mock function
  const createShortVersePoem = (theme) => `
${theme} whispers.
Stars light darkness.
Dreams take flight.
Hope never fades.
Time stands still.
Love conquers all.
Words create worlds.
Souls find peace.
`.trim();

  const createMediumVersePoem = (theme) => `
The gentle whispers of ${theme} echo through my waking dreams.
Memories dance across the canvas of my restless thoughts.
Sunlight filters through the canopy of ancient trees.
Birds sing melodies of forgotten summers and distant shores.
Water flows over smooth stones, patient and persistent.
Mountains stand tall against the backdrop of azure skies.
Time weaves its tapestry of moments both bitter and sweet.
`.trim();

  const createLongVersePoem = (theme) => `
The magnificent tapestry of ${theme} unfolds before our wondering eyes in patterns of infinite complexity and beauty.
Memories of childhood summers drift through consciousness like dandelion seeds carried on a warm afternoon breeze.
Beneath the canopy of stars that stretches endlessly above, we contemplate our place in this vast universe of possibilities.
Ancient wisdom flows through the veins of those who listen carefully to the whispers of forgotten generations long passed.
When darkness threatens to overwhelm the spirit with its heavy mantle of doubt, hope emerges like the first light of dawn.
The symphony of existence plays on in magnificent complexity, each life adding its unique melody to the grand composition.
`.trim();

  // Default samples for different poem types with line length variations
  let poemText = '';
  
  if (lineLength === 'Short') {
    switch(poemType) {
      case 'Sonnet':
        poemText = `
${description} calls.
Hearts answer true.
Love never falls.
Skies remain blue.
Stars shine tonight.
Dreams take new form.
Hope burns so bright.
Through every storm.
Time stands still now.
Souls find their peace.
Faith shows us how.
Pains will all cease.
Trust in this truth.
Love renews youth.
`.trim();
        break;
      case 'Haiku':
        poemText = `
${description} glows
Morning dew sparkles bright
Peace fills the soul
`.trim();
        break;
      default:
        poemText = createShortVersePoem(description);
    }
  } else if (lineLength === 'Long') {
    switch(poemType) {
      case 'Sonnet':
        poemText = `
The magnificent tapestry of ${description} unfolds before our wondering eyes in patterns of infinite complexity and beauty.
When contemplating the profound nature of existence, we discover truths hidden beneath layers of ordinary perception.
Ancient wisdom flows through the veins of those who listen carefully to the whispers of forgotten generations long passed.
The symphony of existence plays on in magnificent complexity, each life adding its unique melody to the grand composition.
Beneath the canopy of stars that stretches endlessly above, we contemplate our place in this vast universe of possibilities.
Memories of childhood summers drift through consciousness like dandelion seeds carried on a warm afternoon breeze.
When darkness threatens to overwhelm the spirit with its heavy mantle of doubt, hope emerges like the first light of dawn.
The journey of self-discovery leads us through landscapes both familiar and strange, challenging our deepest assumptions.
Mountains standing tall against the horizon remind us of our own potential to rise above circumstances and limitations.
Rivers flowing ceaselessly toward distant shores teach us about persistence and the inevitable transformation of all things.
Gardens blooming with unexpected color demonstrate the beautiful possibility that emerges from nurturing what seems dormant.
Forests whispering ancient secrets through rustling leaves connect us to the timeless cycle of growth, death, and renewal.
For in these moments of connection with the world around us, we glimpse the infinite potential that exists within ourselves.
The ever-present possibility of beginning anew gives us courage to face each day with hope and a sense of wonder.
`.trim();
        break;
      case 'Haiku':
        poemText = `
The magnificent and captivating essence of ${description} illuminates our perception of reality and transforms ordinary moments.
Morning dew glistening upon countless blades of grass reveals the extraordinary beauty hidden within seemingly mundane existence.
Profound tranquility descends upon the contemplative mind that recognizes the interconnectedness of all living beings.
`.trim();
        break;
      default:
        poemText = createLongVersePoem(description);
    }
  } else { // Medium (default)
    switch(poemType) {
      case 'Sonnet':
        poemText = `
When ${description} fills the morning air with light,
And sunlight dances through the leaves above,
The world awakens to a beauty bright,
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
We glimpse the beauty of our guiding star.
`.trim();
        break;
      case 'Haiku':
        poemText = `
${description} whispers soft through leaves
Morning dew on petals bright glimmers
Peace fills empty spaces within
`.trim();
        break;
      default:
        poemText = createMediumVersePoem(description);
    }
  }
  
  return poemText;
}