import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export const useSubscription = () => {
  // Simplified subscription hook that doesn't track subscription status
  // All users are considered "subscribed" for poem generation purposes
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  
  // Always return values that allow unlimited poem generation
  return {
    freePoems: 0, // Not used anymore but kept for compatibility
    isSubscribed: true, // Always true to bypass all subscription checks
    loading: false,
    canGeneratePoem: true, // Always true to allow unlimited poem generation
    
    // Maintained for API compatibility but these functions now do nothing
    incrementFreePoems: async () => {},
    refreshSubscriptionData: async () => {},
    
    // Removed createCheckoutSession function as it's no longer needed
  }
}