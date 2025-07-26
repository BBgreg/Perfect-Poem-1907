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

    if (!signature) {
      return new Response(
        JSON.stringify({ error: 'No stripe signature' }),
        { status: 400, headers }
      ) 
    } 

    // Log webhook received
    console.log('Webhook received from Stripe') 
    
    const event = JSON.parse(body) 
    console.log('Processing event:', event.type) 

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')! 
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')! 
    const supabase = createClient(supabaseUrl, supabaseServiceKey) 

    switch (event.type) {
      case 'checkout.session.completed': 
        const session = event.data.object 
        const userId = session.metadata?.user_id 
        const customerId = session.customer 
        const subscriptionId = session.subscription 

        console.log('Checkout session completed webhook received', {
          userId,
          customerId,
          subscriptionId,
          session_id: session.id
        })

        if (userId) {
          console.log('Updating user subscription:', {
            userId,
            customerId,
            subscriptionId
          }) 

          // First check if user profile exists
          const { data: existingProfile, error: fetchError } = await supabase
            .from('user_profiles_sub_mgmt')
            .select('*')
            .eq('user_id', userId)
            .single()

          console.log('Existing profile check result:', { 
            exists: !!existingProfile, 
            fetchError: fetchError?.message 
          })

          // Update or insert user profile with subscription info
          const { data: updateData, error: updateError } = await supabase
            .from('user_profiles_sub_mgmt')
            .upsert({
              user_id: userId,
              is_subscribed: true,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              free_poems_generated: 0, // Reset free poems count
              updated_at: new Date().toISOString()
            })
            .select()

          if (updateError) {
            console.error('Error updating user profile:', updateError)
            console.error('Error details:', JSON.stringify(updateError))
          } else {
            console.log('Successfully updated user subscription status:', updateData)
          }
        } else {
          console.error('Missing userId in checkout session metadata')
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
          isActive
        }) 

        // Find user by stripe customer ID and update subscription status
        const { data: customerData, error: customerLookupError } = await supabase
          .from('user_profiles_sub_mgmt')
          .select('user_id')
          .eq('stripe_customer_id', customerIdFromSub)
          .single()

        if (customerLookupError) {
          console.error('Error finding user by customer ID:', customerLookupError)
        } else if (customerData) {
          console.log('Found user for customer ID:', customerData)
          
          const { error: subUpdateError } = await supabase
            .from('user_profiles_sub_mgmt')
            .update({
              is_subscribed: isActive,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', customerData.user_id)

          if (subUpdateError) {
            console.error('Error updating subscription status:', subUpdateError)
          } else {
            console.log('Successfully updated subscription status for user:', customerData.user_id)
          }
        } else {
          console.error('No user found for customer ID:', customerIdFromSub)
        }
        break 

      default:
        console.log('Unhandled event type:', event.type)
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers }
    ) 
  } catch (error) {
    console.error('Webhook handler error:', error) 
    return new Response(
      JSON.stringify({ error: 'Webhook handler failed' }),
      { status: 500, headers }
    ) 
  }
})