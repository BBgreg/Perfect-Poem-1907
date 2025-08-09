import { serve } from 'https://deno.land/std@0.131.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2' 

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY') || '' 
const STRIPE_PRICE_ID = Deno.env.get('STRIPE_PRICE_ID') || 'price_1RozdEIa1WstuQNenABMe6HD' 

serve(async (req) => {
  const headers = new Headers({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization,x-client-info,apikey,content-type',
    'Content-Type': 'application/json'
  }) 

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers }) 
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      console.error('No authorization header in request')
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers }
      )
    }

    console.log('Processing checkout session creation request')
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    })

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('User authentication error:', userError || 'No user found')
      return new Response(
        JSON.stringify({ error: 'User not authenticated' }),
        { status: 401, headers }
      )
    }

    console.log('Creating checkout session for user:', user.id)
    
    const origin = req.headers.get('origin') || 'http://localhost:5173'
    console.log('Request origin:', origin)
    
    // Create Stripe checkout session
    const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        'mode': 'subscription',
        'line_items[0][price]': STRIPE_PRICE_ID,
        'line_items[0][quantity]': '1',
        'success_url': `${origin}?session_id={CHECKOUT_SESSION_ID}`,
        'cancel_url': `${origin}`,
        'customer_email': user.email || '',
        'metadata[user_id]': user.id,
        'subscription_data[metadata][user_id]': user.id
      })
    })

    if (!stripeResponse.ok) {
      const errorText = await stripeResponse.text()
      console.error('Stripe API Error:', errorText)
      return new Response(
        JSON.stringify({ error: 'Failed to create checkout session', details: errorText }),
        { status: 500, headers }
      )
    }

    const session = await stripeResponse.json()
    console.log('Checkout session created successfully:', session.id)
    
    return new Response(
      JSON.stringify({ url: session.url }),
      { status: 200, headers }
    )
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers }
    )
  }
})