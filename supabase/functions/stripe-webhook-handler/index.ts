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
        const customerEmail = session.customer_details?.email || ''

        console.log('Checkout session completed webhook received:', {
          userId,
          customerId,
          subscriptionId,
          sessionId,
          customerEmail,
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

        // First try to get user email from auth.users if not provided in session
        let userEmail = customerEmail
        if (!userEmail) {
          console.log('Getting user email from auth.users')
          const { data: userData, error: userError } = await supabase
            .from('auth.users')
            .select('email')
            .eq('id', userId)
            .single()
            
          if (userError) {
            console.error('Error getting user email:', userError)
          } else if (userData) {
            userEmail = userData.email
            console.log('Found user email:', userEmail)
          }
        }

        // First check if user profile exists in user_profiles_sub_mgmt
        console.log('Checking if user profile exists in user_profiles_sub_mgmt table')
        const { data: existingProfile, error: fetchError } = await supabase
          .from('user_profiles_sub_mgmt')
          .select('*')
          .eq('id', userId)
          .single()

        console.log('Existing profile check result:', { 
          exists: !!existingProfile, 
          fetchError: fetchError?.message,
          fetchErrorDetails: fetchError ? JSON.stringify(fetchError) : 'none' 
        })

        // Prepare update data for user_profiles_sub_mgmt
        const profileData = {
          id: userId,
          email: userEmail, // Include email in the profile data
          is_subscribed: true,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          free_poems_generated: 0, // Reset free poems count
          updated_at: new Date().toISOString()
        }
        
        console.log('Preparing to update user profile with data:', profileData)

        // Update or insert user profile with subscription info in user_profiles_sub_mgmt
        const { data: updateData, error: updateError } = await supabase
          .from('user_profiles_sub_mgmt')
          .upsert(profileData)
          .select()

        if (updateError) {
          console.error('Error updating user profile in user_profiles_sub_mgmt:', updateError)
          console.error('Error details:', JSON.stringify(updateError))
          
          // Try backup table
          console.log('Trying to update profiles table as backup')
          const { data: backupData, error: backupError } = await supabase
            .from('profiles')
            .upsert({
              id: userId,
              is_subscribed: true,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              free_poems_generated: 0,
              updated_at: new Date().toISOString()
            })
            .select()
            
          if (backupError) {
            console.error('Error updating backup profiles table:', backupError)
            return new Response(
              JSON.stringify({ 
                error: 'Database update failed for both tables',
                details: { primary: updateError, backup: backupError }
              }),
              { status: 500, headers }
            )
          } else {
            console.log('Successfully updated backup profiles table:', backupData)
          }
        } else {
          console.log('Successfully updated user subscription status in user_profiles_sub_mgmt:', updateData)
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

        // Find user by stripe customer ID in user_profiles_sub_mgmt
        console.log('Looking up user by stripe_customer_id in user_profiles_sub_mgmt:', customerIdFromSub)
        const { data: customerData, error: customerLookupError } = await supabase
          .from('user_profiles_sub_mgmt')
          .select('id, email')
          .eq('stripe_customer_id', customerIdFromSub)
          .single()

        if (customerLookupError) {
          console.error('Error finding user by customer ID in user_profiles_sub_mgmt:', customerLookupError)
          
          // Try backup table
          console.log('Looking up user by stripe_customer_id in profiles table')
          const { data: backupCustomerData, error: backupLookupError } = await supabase
            .from('profiles')
            .select('id')
            .eq('stripe_customer_id', customerIdFromSub)
            .single()
            
          if (backupLookupError) {
            console.error('Error finding user in backup profiles table:', backupLookupError)
            return new Response(
              JSON.stringify({ 
                error: 'User lookup failed in both tables',
                details: { primary: customerLookupError, backup: backupLookupError }
              }),
              { status: 500, headers }
            )
          } else if (backupCustomerData) {
            console.log('Found user in backup profiles table:', backupCustomerData)
            
            // Update subscription status in both tables for consistency
            // Update profiles table
            const { error: backupUpdateError } = await supabase
              .from('profiles')
              .update({
                is_subscribed: isActive,
                updated_at: new Date().toISOString()
              })
              .eq('id', backupCustomerData.id)
            
            if (backupUpdateError) {
              console.error('Error updating subscription status in profiles:', backupUpdateError)
            } else {
              console.log('Successfully updated subscription status in profiles table')
            }
            
            // Try to update user_profiles_sub_mgmt as well
            const { error: mainUpdateError } = await supabase
              .from('user_profiles_sub_mgmt')
              .update({
                is_subscribed: isActive,
                updated_at: new Date().toISOString()
              })
              .eq('id', backupCustomerData.id)
            
            if (mainUpdateError) {
              console.error('Error updating user_profiles_sub_mgmt after backup lookup:', mainUpdateError)
            }
          } else {
            console.error('No user found for customer ID in either table:', customerIdFromSub)
            return new Response(
              JSON.stringify({ error: 'No user found for customer ID' }),
              { status: 404, headers }
            )
          }
        } else if (customerData) {
          console.log('Found user for customer ID in user_profiles_sub_mgmt:', customerData)
          
          // Update subscription status in user_profiles_sub_mgmt
          console.log('Updating subscription status to:', isActive)
          const { data: subUpdateData, error: subUpdateError } = await supabase
            .from('user_profiles_sub_mgmt')
            .update({
              is_subscribed: isActive,
              updated_at: new Date().toISOString()
            })
            .eq('id', customerData.id)
            .select()

          if (subUpdateError) {
            console.error('Error updating subscription status in user_profiles_sub_mgmt:', subUpdateError)
            console.error('Error details:', JSON.stringify(subUpdateError))
            
            // Try backup table
            console.log('Trying to update subscription status in profiles table')
            const { error: backupUpdateError } = await supabase
              .from('profiles')
              .update({
                is_subscribed: isActive,
                updated_at: new Date().toISOString()
              })
              .eq('id', customerData.id)
              
            if (backupUpdateError) {
              console.error('Error updating backup profiles table:', backupUpdateError)
              return new Response(
                JSON.stringify({ 
                  error: 'Subscription update failed for both tables',
                  details: { primary: subUpdateError, backup: backupUpdateError }
                }),
                { status: 500, headers }
              )
            } else {
              console.log('Successfully updated subscription status in backup profiles table')
            }
          } else {
            console.log('Successfully updated subscription status in user_profiles_sub_mgmt for user:', customerData.id)
            console.log('Updated data:', subUpdateData)
            
            // For consistency, also update the profiles table
            console.log('Updating profiles table for consistency')
            const { error: consistencyError } = await supabase
              .from('profiles')
              .update({
                is_subscribed: isActive,
                updated_at: new Date().toISOString()
              })
              .eq('id', customerData.id)
              
            if (consistencyError) {
              console.error('Error updating profiles table for consistency:', consistencyError)
            } else {
              console.log('Successfully updated profiles table for consistency')
            }
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