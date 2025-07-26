import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from './hooks/useAuth'
import { usePoems } from './hooks/usePoems'
import { useSubscription } from './hooks/useSubscription'
import { generatePoem } from './services/poemGenerator'
import Header from './components/Header/Header'
import Hero from './components/Landing/Hero'
import PoemForm from './components/PoemGenerator/PoemForm'
import PoemDisplay from './components/PoemGenerator/PoemDisplay'
import BlurredPoemDisplay from './components/PoemGenerator/BlurredPoemDisplay'
import PoemLibrary from './components/PoemLibrary/PoemLibrary'
import PricingSection from './components/Pricing/PricingSection'
import PaywallModal from './components/Pricing/PaywallModal'
import AuthModal from './components/Auth/AuthModal'
import SaveConfirmation from './components/PoemGenerator/SaveConfirmation'
import SafeIcon from './common/SafeIcon'
import * as FiIcons from 'react-icons/fi'

const { FiEdit3, FiBook, FiHome, FiDollarSign, FiCheck, FiZap } = FiIcons

function App() {
  const { user, loading: authLoading } = useAuth()
  const { createPoem } = usePoems()
  const { freePoems, isSubscribed, loading: subscriptionLoading, incrementFreePoems, canGeneratePoem, refreshSubscriptionData } = useSubscription()
  const [currentView, setCurrentView] = useState('create')
  const [currentPoem, setCurrentPoem] = useState(null)
  const [generatingPoem, setGeneratingPoem] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showPaywallModal, setShowPaywallModal] = useState(false)
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false)
  const [confirmationMessage, setConfirmationMessage] = useState("")
  const [confirmationType, setConfirmationType] = useState("success")
  const [confirmationDismissible, setConfirmationDismissible] = useState(false)
  const [unsavedPoem, setUnsavedPoem] = useState(null)
  const [generationError, setGenerationError] = useState('')

  // Check for successful subscription on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const sessionId = urlParams.get('session_id')
    
    if (sessionId) {
      // Clear the URL parameter
      window.history.replaceState({}, document.title, window.location.pathname)
      
      // Refresh subscription data
      setTimeout(() => {
        refreshSubscriptionData()
        setConfirmationMessage("Subscription activated! You now have unlimited access to poem generation.")
        setConfirmationType("success")
        setConfirmationDismissible(true)
        setShowSaveConfirmation(true)
      }, 2000)
    }
  }, [refreshSubscriptionData])

  // If we have an unsaved poem and the user logs in, save it
  useEffect(() => {
    const saveUnsavedPoem = async () => {
      if (user && unsavedPoem) {
        try {
          const { data, error } = await createPoem(unsavedPoem)
          if (error) {
            console.error('Error saving poem:', error)
          } else {
            setCurrentPoem(data)
            setConfirmationMessage("Poem saved to My Collection!")
            setConfirmationType("success")
            setConfirmationDismissible(false)
            setShowSaveConfirmation(true)
            // Clear the unsaved poem
            setUnsavedPoem(null)
            // Hide save confirmation after 3 seconds
            setTimeout(() => {
              setShowSaveConfirmation(false)
            }, 3000)
          }
        } catch (err) {
          console.error('Error saving poem:', err)
        }
      }
    }
    saveUnsavedPoem()
  }, [user, unsavedPoem])

  const handleGetStarted = () => {
    setCurrentView('create')
  }

  const handleGeneratePoem = async (formData) => {
    // Check if user is authenticated
    if (!user) {
      // For unauthenticated users, show the existing auth modal on first generation
      setShowAuthModal(true)
      return
    }

    // Check subscription status and free poem limit
    if (!isSubscribed && freePoems >= 3) {
      setShowPaywallModal(true)
      return
    }

    setGeneratingPoem(true)
    setGenerationError('')
    
    try {
      console.log('Perfect Poem: Raw form data received:', formData)
      
      // Construct the payload with proper validation and defaults
      const payload = {
        poemType: formData.poemType || 'Free Verse',
        rhymeScheme: formData.rhymePattern || 'None (Free Verse)',
        description: formData.description || '',
        lineCount: formData.lineCount || '',
        lineLength: formData.lineLength || 'Medium'
      }

      // Add comprehensive logging
      console.log('Perfect Poem: Sending payload to Edge Function:', payload)
      console.log('Perfect Poem: Payload validation:')
      console.log(' - poemType:', payload.poemType, '(type:', typeof payload.poemType, ')')
      console.log(' - rhymeScheme:', payload.rhymeScheme, '(type:', typeof payload.rhymeScheme, ')')
      console.log(' - description:', payload.description, '(type:', typeof payload.description, ')')
      console.log(' - lineCount:', payload.lineCount, '(type:', typeof payload.lineCount, ')')
      console.log(' - lineLength:', payload.lineLength, '(type:', typeof payload.lineLength, ')')
      console.log('Perfect Poem: JSON stringified payload:', JSON.stringify(payload, null, 2))

      // Validate required fields
      if (!payload.description || payload.description.trim() === '') {
        throw new Error('Description is required to generate a poem')
      }
      if (!payload.poemType || payload.poemType.trim() === '') {
        throw new Error('Poem type is required to generate a poem')
      }

      // Final check to ensure rhymeScheme is never empty
      if (!payload.rhymeScheme || payload.rhymeScheme.trim() === '') {
        console.log('Perfect Poem: Empty rhymeScheme detected, using fallback value')
        payload.rhymeScheme = 'None (Free Verse)'
      }

      // Generate poem using Supabase Edge Function
      const generatedText = await generatePoem(payload)

      // Create poem data object
      const poemData = {
        poem_type: payload.poemType,
        rhyme_pattern: payload.rhymeScheme,
        description_input: payload.description,
        generated_text: generatedText,
        line_count_requested: payload.lineCount,
        line_length_requested: payload.lineLength,
        created_at: new Date().toISOString()
      }

      // Set current poem for display
      setCurrentPoem({
        ...poemData,
        id: 'temp-' + Date.now(),
      })

      // Save to database for authenticated users
      console.log('User authenticated, saving poem to database')
      const { data, error } = await createPoem(poemData)
      if (error) {
        console.error('Error saving poem:', error)
      } else {
        setCurrentPoem(data)
        setConfirmationMessage("Poem saved to My Collection!")
        setConfirmationType("success")
        setConfirmationDismissible(false)
        setShowSaveConfirmation(true)
        // Hide save confirmation after 3 seconds
        setTimeout(() => {
          setShowSaveConfirmation(false)
        }, 3000)
      }

      // Increment free poems counter for non-subscribed users
      if (!isSubscribed) {
        await incrementFreePoems()
      }

      setCurrentView('result')
    } catch (error) {
      console.error('Perfect Poem: Error generating poem:', error)
      setGenerationError(error.message || 'An unexpected error occurred while generating your poem.')
    } finally {
      setGeneratingPoem(false)
    }
  }

  const handleUnlockPoem = () => {
    setShowAuthModal(true)
  }

  const handleRetryGeneration = () => {
    setGenerationError('')
  }

  const handleDismissConfirmation = () => {
    setShowSaveConfirmation(false)
  }

  const navigation = [
    { id: 'home', label: 'Home', icon: FiHome },
    { id: 'create', label: 'Create', icon: FiEdit3 },
    { id: 'pricing', label: 'Pricing', icon: FiDollarSign },
    { id: 'library', label: 'Library', icon: FiBook },
  ]

  if (authLoading || subscriptionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Perfect Poem...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      <Header />

      {user && (
        <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8 py-4">
              {navigation.map(({ id, label, icon }) => (
                <button
                  key={id}
                  onClick={() => setCurrentView(id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    currentView === id
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <SafeIcon icon={icon} className="w-4 h-4" />
                  <span>{label}</span>
                </button>
              ))}
              
              {/* Subscription status indicator */}
              {user && (
                <div className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-600">
                  {isSubscribed ? (
                    <>
                      <SafeIcon icon={FiCheck} className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Unlimited</span>
                    </>
                  ) : (
                    <>
                      <SafeIcon icon={FiZap} className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm">{3 - freePoems} free poems left</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </nav>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {currentView === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Hero onGetStarted={handleGetStarted} />
            </motion.div>
          )}

          {currentView === 'create' && (
            <motion.div
              key="create"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-4xl mx-auto"
            >
              <PoemForm
                onGenerate={handleGeneratePoem}
                loading={generatingPoem}
                error={generationError}
                onRetry={handleRetryGeneration}
                canGenerate={!user || canGeneratePoem}
                freePoems={freePoems}
                isSubscribed={isSubscribed}
              />
            </motion.div>
          )}

          {currentView === 'pricing' && (
            <motion.div
              key="pricing"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <PricingSection />
            </motion.div>
          )}

          {currentView === 'result' && currentPoem && (
            <motion.div
              key="result"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-4xl mx-auto space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Your Generated Poem</h2>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setCurrentView('create')}
                    className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Create Another
                  </button>
                  {user && (
                    <button
                      onClick={() => setCurrentView('library')}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      View Library
                    </button>
                  )}
                </div>
              </div>

              {user ? (
                <PoemDisplay poem={currentPoem} showActions={true} />
              ) : (
                <BlurredPoemDisplay poem={currentPoem} onUnlock={handleUnlockPoem} />
              )}
            </motion.div>
          )}

          {currentView === 'library' && user && (
            <motion.div
              key="library"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <PoemLibrary />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      <PaywallModal
        isOpen={showPaywallModal}
        onClose={() => setShowPaywallModal(false)}
      />

      <AnimatePresence>
        {showSaveConfirmation && (
          <SaveConfirmation
            visible={showSaveConfirmation}
            message={confirmationMessage}
            type={confirmationType}
            dismissible={confirmationDismissible}
            onDismiss={handleDismissConfirmation}
            onAnimationComplete={() => {}}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default App