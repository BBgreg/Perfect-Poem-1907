import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export const useSubscription = () => {
  const { user } = useAuth()
  const [subscriptionData, setSubscriptionData] = useState({
    freePoems: 0,
    isSubscribed: false,
    loading: true
  })
  const [lastRefreshed, setLastRefreshed] = useState(0)

  const fetchSubscriptionData = async () => {
    if (!user) {
      setSubscriptionData({
        freePoems: 0,
        isSubscribed: false,
        loading: false
      })
      return
    }

    try {
      console.log('Fetching subscription data for user:', user.id)
      
      // Get or create user profile
      const { data: profile, error } = await supabase
        .from('user_profiles_sub_mgmt')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist, create it
        console.log('Creating new user profile for subscription management')
        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles_sub_mgmt')
          .insert({
            user_id: user.id,
            free_poems_generated: 0,
            is_subscribed: false
          })
          .select()
          .single()

        if (createError) {
          console.error('Error creating user profile:', createError)
          setSubscriptionData({
            freePoems: 0,
            isSubscribed: false,
            loading: false
          })
          return
        }
        
        console.log('New profile created:', newProfile)
        setSubscriptionData({
          freePoems: newProfile.free_poems_generated,
          isSubscribed: newProfile.is_subscribed,
          loading: false
        })
      } else if (error) {
        console.error('Error fetching subscription data:', error)
        setSubscriptionData({
          freePoems: 0,
          isSubscribed: false,
          loading: false
        })
      } else {
        console.log('Subscription data fetched:', profile)
        setSubscriptionData({
          freePoems: profile.free_poems_generated,
          isSubscribed: profile.is_subscribed,
          loading: false
        })
      }
      
      setLastRefreshed(Date.now())
    } catch (error) {
      console.error('Error in fetchSubscriptionData:', error)
      setSubscriptionData({
        freePoems: 0,
        isSubscribed: false,
        loading: false
      })
    }
  }

  // Fetch subscription data when user changes
  useEffect(() => {
    fetchSubscriptionData()
  }, [user])

  // Set up realtime subscription updates when user is available
  useEffect(() => {
    if (!user) return
    
    console.log('Setting up realtime subscription for user_profiles_sub_mgmt')
    
    const channel = supabase
      .channel('profile-updates')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'user_profiles_sub_mgmt',
          filter: `user_id=eq.${user.id}`
        }, 
        (payload) => {
          console.log('Realtime update received for user profile:', payload)
          if (payload.new) {
            console.log('Updating subscription data from realtime event:', payload.new)
            setSubscriptionData({
              freePoems: payload.new.free_poems_generated,
              isSubscribed: payload.new.is_subscribed,
              loading: false
            })
          }
        }
      )
      .subscribe()
      
    return () => {
      console.log('Unsubscribing from realtime updates')
      supabase.removeChannel(channel)
    }
  }, [user])

  // Check URL for session_id parameter on component mount
  useEffect(() => {
    const checkSessionParam = async () => {
      if (!user) return
      
      const urlParams = new URLSearchParams(window.location.search)
      const sessionId = urlParams.get('session_id')
      
      if (sessionId) {
        console.log('Detected successful Stripe payment, refreshing subscription data')
        console.log('Session ID from URL:', sessionId)
        
        // Clear the URL parameter
        window.history.replaceState({}, document.title, window.location.pathname)
        
        // Force a refresh of subscription data to get updated status
        await fetchSubscriptionData()
        
        // Set up periodic checks for subscription status
        const checkInterval = setInterval(async () => {
          console.log('Running periodic check for subscription status')
          await fetchSubscriptionData()
          
          // If subscription is active or we've tried for 30 seconds, clear the interval
          if (subscriptionData.isSubscribed || Date.now() - lastRefreshed > 30000) {
            clearInterval(checkInterval)
          }
        }, 3000)
        
        // Clean up interval after 30 seconds max
        setTimeout(() => {
          clearInterval(checkInterval)
        }, 30000)
      }
    }
    
    checkSessionParam()
  }, [user])

  const incrementFreePoems = async () => {
    if (!user || subscriptionData.isSubscribed) return

    try {
      console.log('Incrementing free poems count for user:', user.id)
      const { data, error } = await supabase
        .from('user_profiles_sub_mgmt')
        .update({
          free_poems_generated: subscriptionData.freePoems + 1,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        console.error('Error incrementing free poems:', error)
        return
      }

      console.log('Free poems incremented successfully:', data)
      setSubscriptionData(prev => ({
        ...prev,
        freePoems: data.free_poems_generated
      }))
    } catch (error) {
      console.error('Error in incrementFreePoems:', error)
    }
  }

  const createCheckoutSession = async () => {
    try {
      console.log('Creating Stripe checkout session')
      
      // Get current session for auth token
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('No active session')
      }
      
      console.log('Using auth token for checkout session creation')
      
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {},
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      })

      if (error) {
        console.error('Error creating checkout session:', error)
        throw new Error('Failed to create checkout session')
      }
      
      console.log('Checkout session created, redirecting to:', data.url)
      return data.url
    } catch (error) {
      console.error('Error in createCheckoutSession:', error)
      throw error
    }
  }

  const refreshSubscriptionData = async () => {
    console.log('Manually refreshing subscription data')
    return await fetchSubscriptionData()
  }

  return {
    freePoems: subscriptionData.freePoems,
    isSubscribed: subscriptionData.isSubscribed,
    loading: subscriptionData.loading,
    incrementFreePoems,
    createCheckoutSession,
    refreshSubscriptionData,
    canGeneratePoem: subscriptionData.isSubscribed || subscriptionData.freePoems < 3
  }
}