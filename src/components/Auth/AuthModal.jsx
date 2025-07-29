import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../hooks/useAuth'
import SafeIcon from '../../common/SafeIcon'
import * as FiIcons from 'react-icons/fi' 

const { FiX, FiMail, FiLock, FiUser, FiAlertCircle, FiCheckCircle } = FiIcons 

const AuthModal = ({ isOpen, onClose, mode: initialMode = 'signin' }) => {
  const [mode, setMode] = useState(initialMode) 
  const [email, setEmail] = useState('') 
  const [password, setPassword] = useState('') 
  const [loading, setLoading] = useState(false) 
  const [error, setError] = useState('') 
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false) 
  const { signInWithEmail, signUpWithEmail, user } = useAuth() 

  // Close the modal if the user becomes authenticated
  useEffect(() => {
    if (user && isOpen) {
      onClose() 
      setEmail('') 
      setPassword('')
    }
  }, [user, isOpen]) 

  const handleSubmit = async (e) => {
    e.preventDefault() 
    setLoading(true) 
    setError('') 

    try {
      if (mode === 'signin') {
        console.log('AuthModal: Attempting sign in for:', email)
        const { error } = await signInWithEmail(email, password) 
        if (error) {
          console.error('AuthModal: Sign in error:', error)
          setError(error.message) 
        } else {
          console.log('AuthModal: Sign in successful')
          onClose() 
          setEmail('') 
          setPassword('')
        }
      } else {
        // Sign up flow
        console.log('AuthModal: Attempting sign up for:', email)
        const { error, data } = await signUpWithEmail(email, password) 
        
        if (error) {
          console.error('AuthModal: Sign up error:', error)
          setError(error.message) 
        } else {
          console.log('AuthModal: Sign up response:', {
            user: data?.user ? 'User created' : 'No user',
            session: data?.session ? 'Session exists' : 'No session',
            needsConfirmation: data?.user?.identities?.length === 0 || data?.user?.email_confirmed_at === null
          })

          // Check if email confirmation is required
          if (data?.user?.identities?.length === 0 || data?.user?.email_confirmed_at === null) {
            console.log('AuthModal: Email confirmation required')
            // Show email confirmation message
            setShowEmailConfirmation(true) 
            // Don't close modal yet - keep it open with the confirmation message
          } else {
            console.log('AuthModal: No email confirmation needed, signing in user')
            // If no confirmation needed (rare case), close modal
            onClose() 
            setEmail('') 
            setPassword('')
          }
        }
      }
    } catch (err) {
      console.error('AuthModal: Unexpected error:', err)
      setError('An unexpected error occurred') 
    } finally {
      setLoading(false) 
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <SafeIcon icon={FiX} className="w-5 h-5" />
            </button>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="text-gray-600">
                {mode === 'signin' 
                  ? 'Sign in to view and save your poem' 
                  : 'Join Perfect Poem to unlock your creation'}
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            {showEmailConfirmation && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-50 border border-green-200 text-green-700 px-4 py-4 rounded-lg mb-6 flex items-start gap-3"
              >
                <SafeIcon icon={FiCheckCircle} className="w-5 h-5 mt-0.5 text-green-500 flex-shrink-0" />
                <div>
                  <p className="font-medium mb-1">Success! Please check your email.</p>
                  <p className="text-sm">
                    We've sent a confirmation link to <strong>{email}</strong>. Please check your email (including spam folder) to confirm your account and unlock your poem.
                  </p>
                </div>
              </motion.div>
            )}

            {!showEmailConfirmation && (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <SafeIcon icon={FiMail} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <SafeIcon icon={FiLock} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Enter your password"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-3 rounded-lg font-medium hover:from-primary-700 hover:to-secondary-700 transition-all duration-200 disabled:opacity-50"
                >
                  {loading ? 'Please wait...' : (mode === 'signin' ? 'Sign In' : 'Create Account')}
                </button>
              </form>
            )}

            {showEmailConfirmation ? (
              <div className="mt-6 text-center">
                <button
                  onClick={() => {
                    setShowEmailConfirmation(false) 
                    setMode('signin') 
                    setEmail('') 
                    setPassword('')
                  }}
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <div className="mt-6 text-center">
                <button
                  onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  {mode === 'signin' 
                    ? "Don't have an account? Sign up" 
                    : "Already have an account? Sign in"}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default AuthModal