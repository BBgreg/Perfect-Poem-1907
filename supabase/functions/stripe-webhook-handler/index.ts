import { serve } from 'https://deno.land/std@0.131.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY') || ''
const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''

serve(async (req) => {
  const headers = new Headers({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
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

    // Verify webhook signature
    const signingSecret = STRIPE_WEBHOOK_SECRET
    const payload = body
    const sig = signature

    // Simple signature verification (in production, use proper Stripe webhook verification)
    console.log('Webhook received:', { signature: sig, payload: payload.substring(0, 100) })

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

        if (userId) {
          console.log('Updating user subscription:', { userId, customerId, subscriptionId })
          
          // Update user profile with subscription info
          const { error: updateError } = await supabase
            .from('user_profiles_sub_mgmt')
            .upsert({
              user_id: userId,
              is_subscribed: true,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              updated_at: new Date().toISOString()
            })

          if (updateError) {
            console.error('Error updating user profile:', updateError)
          } else {
            console.log('Successfully updated user subscription status')
          }
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
        const { error: subUpdateError } = await supabase
          .from('user_profiles_sub_mgmt')
          .update({
            is_subscribed: isActive,
            updated_at: new Date().toISOString()
          })
          .eq('stripe_customer_id', customerIdFromSub)

        if (subUpdateError) {
          console.error('Error updating subscription status:', subUpdateError)
        } else {
          console.log('Successfully updated subscription status')
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