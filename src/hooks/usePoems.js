import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export const usePoems = () => {
  const [poems, setPoems] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const fetchPoems = async () => {
    if (!user) {
      setPoems([])
      setLoading(false)
      return
    }

    try {
      console.log('Fetching poems for user:', user.id)
      const { data, error } = await supabase
        .from('poems')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching poems:', error)
        throw error
      }

      console.log('Fetched poems:', data)
      setPoems(data || [])
    } catch (error) {
      console.error('Error fetching poems:', error)
      setPoems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPoems()
  }, [user])

  const createPoem = async (poemData) => {
    if (!user) {
      console.error('User not authenticated')
      return { error: 'User not authenticated' }
    }

    try {
      console.log('Creating poem with data:', poemData)
      const { data, error } = await supabase
        .from('poems')
        .insert([{ ...poemData, user_id: user.id }])
        .select()
        .single()

      if (error) {
        console.error('Error creating poem:', error)
        throw error
      }

      console.log('Created poem:', data)
      setPoems(prev => [data, ...prev])
      return { data, error: null }
    } catch (error) {
      console.error('Error creating poem:', error)
      return { data: null, error }
    }
  }

  const updatePoem = async (id, updates) => {
    if (!user) return { error: 'User not authenticated' }

    try {
      const { data, error } = await supabase
        .from('poems')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error

      setPoems(prev => prev.map(poem => 
        poem.id === id ? { ...poem, ...data } : poem
      ))
      return { data, error: null }
    } catch (error) {
      console.error('Error updating poem:', error)
      return { data: null, error }
    }
  }

  const deletePoem = async (id) => {
    if (!user) return { error: 'User not authenticated' }

    try {
      const { error } = await supabase
        .from('poems')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error

      setPoems(prev => prev.filter(poem => poem.id !== id))
      return { error: null }
    } catch (error) {
      console.error('Error deleting poem:', error)
      return { error }
    }
  }

  return {
    poems,
    loading,
    createPoem,
    updatePoem,
    deletePoem,
    refetch: fetchPoems
  }
}