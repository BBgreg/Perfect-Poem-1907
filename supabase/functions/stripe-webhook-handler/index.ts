import { serve } from 'https://deno.land/std@0.131.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2' 

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY') || '' 
const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '' 

serve(async (req) => {
  const headers = new Headers({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization,x-client-info,apikey,content-type,stripe-signature',
    'Content-Type': 'application/json'
  }) 

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers }) 
  } 

  try {
    const body = await req.text() 
    const signature = req.headers.get('stripe-signature') 

    console.log('Stripe Webhook received - Time:', new Date().toISOString())
    
    if (!signature) {
      console.error('Error: No stripe signature in request')
      return new Response(
        JSON.stringify({ error: 'No stripe signature' }),
        { status: 400, headers }
      ) 
    } 

    // Log the raw event data for debugging
    console.log('Webhook raw data received:', body.substring(0, 200) + '...')
    
    const event = JSON.parse(body) 
    console.log('Processing Stripe event type:', event.type)
    console.log('Stripe Event ID:', event.id)

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')! 
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')! 
    console.log('Initializing Supabase client with URL:', supabaseUrl)
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey) 
    console.log('Supabase client initialized successfully')

    switch (event.type) {
      case 'checkout.session.completed': 
        const session = event.data.object 
        const userId = session.metadata?.user_id 
        const customerId = session.customer 
        const subscriptionId = session.subscription 
        const sessionId = session.id

        console.log('Checkout session completed webhook received:', {
          userId,
          customerId,
          subscriptionId,
          sessionId,
          session_status: session.status,
          payment_status: session.payment_status
        })

        if (!userId) {
          console.error('Missing userId in checkout session metadata')
          return new Response(
            JSON.stringify({ error: 'Missing userId in session metadata' }),
            { status: 400, headers }
          )
        }

        console.log('Updating user subscription status for user:', userId)

        // First check if user profile exists
        console.log('Checking if user profile exists in user_profiles_sub_mgmt table')
        const { data: existingProfile, error: fetchError } = await supabase
          .from('user_profiles_sub_mgmt')
          .select('*')
          .eq('user_id', userId)
          .single()

        console.log('Existing profile check result:', { 
          exists: !!existingProfile, 
          fetchError: fetchError?.message,
          fetchErrorDetails: fetchError ? JSON.stringify(fetchError) : 'none' 
        })

        // Prepare update data
        const profileData = {
          user_id: userId,
          is_subscribed: true,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          free_poems_generated: 0, // Reset free poems count
          updated_at: new Date().toISOString()
        }
        
        console.log('Preparing to update user profile with data:', profileData)

        // Update or insert user profile with subscription info
        const { data: updateData, error: updateError } = await supabase
          .from('user_profiles_sub_mgmt')
          .upsert(profileData)
          .select()

        if (updateError) {
          console.error('Error updating user profile:', updateError)
          console.error('Error details:', JSON.stringify(updateError))
          return new Response(
            JSON.stringify({ 
              error: 'Database update failed',
              details: updateError
            }),
            { status: 500, headers }
          )
        } else {
          console.log('Successfully updated user subscription status:', updateData)
        }
        break 

      case 'customer.subscription.deleted':
      case 'customer.subscription.updated':
        const subscription = event.data.object 
        const customerIdFromSub = subscription.customer 
        const isActive = subscription.status === 'active' 

        console.log('Subscription status change:', {
          customerId: customerIdFromSub,
          status: subscription.status,
          isActive,
          subscriptionId: subscription.id
        })

        // Find user by stripe customer ID and update subscription status
        console.log('Looking up user by stripe_customer_id:', customerIdFromSub)
        const { data: customerData, error: customerLookupError } = await supabase
          .from('user_profiles_sub_mgmt')
          .select('user_id')
          .eq('stripe_customer_id', customerIdFromSub)
          .single()

        if (customerLookupError) {
          console.error('Error finding user by customer ID:', customerLookupError)
          console.error('Error details:', JSON.stringify(customerLookupError))
          return new Response(
            JSON.stringify({ 
              error: 'User lookup failed',
              details: customerLookupError
            }),
            { status: 500, headers }
          )
        } else if (customerData) {
          console.log('Found user for customer ID:', customerData)
          
          console.log('Updating subscription status to:', isActive)
          const { data: subUpdateData, error: subUpdateError } = await supabase
            .from('user_profiles_sub_mgmt')
            .update({
              is_subscribed: isActive,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', customerData.user_id)
            .select()

          if (subUpdateError) {
            console.error('Error updating subscription status:', subUpdateError)
            console.error('Error details:', JSON.stringify(subUpdateError))
            return new Response(
              JSON.stringify({ 
                error: 'Subscription update failed',
                details: subUpdateError
              }),
              { status: 500, headers }
            )
          } else {
            console.log('Successfully updated subscription status for user:', customerData.user_id)
            console.log('Updated data:', subUpdateData)
          }
        } else {
          console.error('No user found for customer ID:', customerIdFromSub)
          return new Response(
            JSON.stringify({ error: 'No user found for customer ID' }),
            { status: 404, headers }
          )
        }
        break 

      default:
        console.log('Unhandled event type:', event.type)
    }

    console.log('Webhook processing completed successfully')
    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers }
    ) 
  } catch (error) {
    console.error('Webhook handler error:', error) 
    console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)))
    return new Response(
      JSON.stringify({ error: 'Webhook handler failed', details: String(error) }),
      { status: 500, headers }
    ) 
  }
})