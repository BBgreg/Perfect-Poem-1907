import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export const useAuth = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.error('Error getting session:', error)
        } else {
          setUser(session?.user ?? null)
        }
      } catch (error) {
        console.error('Error in getSession:', error)
      } finally {
        setLoading(false)
      }
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        setUser(session?.user ?? null)
        setLoading(false)

        // Handle new user signup - ensure profile is created
        if (event === 'SIGNED_UP' && session?.user) {
          console.log('New user signed up, ensuring profile exists:', session.user.id)
          await ensureUserProfile(session.user)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const ensureUserProfile = async (user) => {
    try {
      console.log('Checking if profile exists for user:', user.id)
      
      // First check if profile already exists in user_profiles_sub_mgmt table
      const { data: existingProfile, error: fetchError } = await supabase
        .from('user_profiles_sub_mgmt')
        .select('*')
        .eq('id', user.id)
        .single()

      if (fetchError && fetchError.code === 'PGRST116') {
        // Profile doesn't exist, create it
        console.log('Profile does not exist in user_profiles_sub_mgmt, creating new profile for user:', user.id)
        
        const profileData = {
          id: user.id,
          email: user.email, // Include email in the profile data
          free_poems_generated: 0,
          is_subscribed: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        console.log('Attempting to insert profile data:', profileData)

        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles_sub_mgmt')
          .insert(profileData)
          .select()
          .single()

        if (createError) {
          console.error('Error creating user profile in user_profiles_sub_mgmt:', createError)
          console.error('Profile creation error details:', JSON.stringify(createError))
          
          // Try again with more detailed error logging
          console.log('Retrying profile creation with alternative approach...')
          const { error: retryError } = await supabase
            .from('user_profiles_sub_mgmt')
            .insert(profileData)
          
          if (retryError) {
            console.error('Retry failed:', retryError)
          } else {
            console.log('Profile creation retry succeeded')
          }
        } else {
          console.log('Successfully created user profile in user_profiles_sub_mgmt:', newProfile)
        }
      } else if (fetchError) {
        console.error('Error checking existing profile in user_profiles_sub_mgmt:', fetchError)
      } else {
        console.log('Profile already exists for user in user_profiles_sub_mgmt:', user.id, existingProfile)
        
        // Check if email needs to be updated
        if (!existingProfile.email) {
          console.log('Updating missing email in existing profile')
          const { error: updateError } = await supabase
            .from('user_profiles_sub_mgmt')
            .update({ email: user.email, updated_at: new Date().toISOString() })
            .eq('id', user.id)
          
          if (updateError) {
            console.error('Error updating email in profile:', updateError)
          } else {
            console.log('Successfully updated email in profile')
          }
        }
      }
      
      // Also check if profile exists in profiles table (as backup)
      const { data: existingProfileBackup, error: fetchErrorBackup } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (fetchErrorBackup && fetchErrorBackup.code === 'PGRST116') {
        // Backup profile doesn't exist, create it
        console.log('Backup profile does not exist in profiles table, creating it')
        
        const profileDataBackup = {
          id: user.id,
          free_poems_generated: 0,
          is_subscribed: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        const { error: createErrorBackup } = await supabase
          .from('profiles')
          .insert(profileDataBackup)
        
        if (createErrorBackup) {
          console.error('Error creating backup profile:', createErrorBackup)
        } else {
          console.log('Successfully created backup profile')
        }
      }
      
    } catch (error) {
      console.error('Error in ensureUserProfile:', error)
    }
  }

  const signInWithEmail = async (email, password) => {
    try {
      console.log('Attempting to sign in user:', email)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('Sign in error:', error)
      } else {
        console.log('Sign in successful for user:', data.user?.email)
      }

      return { data, error }
    } catch (error) {
      console.error('Sign in error:', error)
      return { data: null, error }
    }
  }

  const signUpWithEmail = async (email, password) => {
    try {
      console.log('Attempting to sign up new user:', email)
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin
        }
      })

      // Log comprehensive signup information
      console.log('Signup response received:', {
        user: data?.user ? {
          id: data.user.id,
          email: data.user.email,
          email_confirmed_at: data.user.email_confirmed_at,
          created_at: data.user.created_at
        } : null,
        session: data?.session ? 'Session exists' : 'No session',
        error: error ? error.message : 'No error'
      })

      if (error) {
        console.error('Sign up error:', error)
        return { data, error }
      }

      // If signup was successful and we have a user
      if (data?.user) {
        console.log('Signup successful, user created:', data.user.id)
        
        // Ensure user profile is created immediately
        await ensureUserProfile(data.user)
        
        // Set up a retry mechanism for profile creation as a fallback
        const maxRetries = 3
        let retryCount = 0
        
        const retryProfileCreation = async () => {
          if (retryCount < maxRetries) {
            retryCount++
            console.log(`Retry attempt ${retryCount} for profile creation...`)
            
            try {
              await ensureUserProfile(data.user)
            } catch (retryError) {
              console.error(`Retry ${retryCount} failed:`, retryError)
              
              // Wait longer between retries
              setTimeout(retryProfileCreation, 1000 * retryCount)
            }
          }
        }
        
        // First retry after 2 seconds
        setTimeout(retryProfileCreation, 2000)
      }

      return { data, error }
    } catch (error) {
      console.error('Sign up error:', error)
      return { data: null, error }
    }
  }

  const signOut = async () => {
    try {
      console.log('Signing out user')
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Sign out error:', error)
      } else {
        console.log('Sign out successful')
      }
      return { error }
    } catch (error) {
      console.error('Sign out error:', error)
      return { error }
    }
  }

  return {
    user,
    loading,
    signInWithEmail,
    signUpWithEmail,
    signOut,
  }
}