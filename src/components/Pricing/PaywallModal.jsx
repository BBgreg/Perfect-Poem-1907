import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSubscription } from '../../hooks/useSubscription'
import SafeIcon from '../../common/SafeIcon'
import * as FiIcons from 'react-icons/fi' 

const { FiX, FiStar, FiCheck, FiCreditCard, FiZap } = FiIcons 

const PaywallModal = ({ isOpen, onClose }) => {
  const { createCheckoutSession, refreshSubscriptionData } = useSubscription()
  const [loading, setLoading] = useState(false)
  
  const handleSubscribe = async () => {
    setLoading(true)
    
    try {
      console.log('Creating checkout session from PaywallModal')
      
      // Force refresh subscription data first to ensure we have latest status
      await refreshSubscriptionData()
      
      const checkoutUrl = await createCheckoutSession()
      console.log('Redirecting to Stripe checkout:', checkoutUrl)
      window.location.href = checkoutUrl
    } catch (error) {
      console.error('Error creating checkout session:', error)
      alert('Failed to create checkout session. Please try again.')
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
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white p-6 text-center relative">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <SafeIcon icon={FiX} className="w-5 h-5" />
              </button>
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
                <SafeIcon icon={FiZap} className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Unlock Unlimited Poems!</h2>
              <p className="text-primary-100">
                You've enjoyed 3 free poems! Continue your poetic journey with unlimited access.
              </p>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Pricing display */}
              <div className="text-center mb-6">
                <div className="flex items-center justify-center mb-2">
                  <span className="text-3xl font-bold text-gray-900">$2.99</span>
                  <span className="text-gray-500 ml-2">/month</span>
                </div>
                <p className="text-gray-600">Perfect for unlimited poetry creation</p>
              </div>

              {/* Features */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center">
                  <SafeIcon icon={FiCheck} className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Unlimited poem generation</span>
                </div>
                <div className="flex items-center">
                  <SafeIcon icon={FiCheck} className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">All poem types & styles</span>
                </div>
                <div className="flex items-center">
                  <SafeIcon icon={FiCheck} className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Personal poem library</span>
                </div>
                <div className="flex items-center">
                  <SafeIcon icon={FiCheck} className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Download & share poems</span>
                </div>
                <div className="flex items-center">
                  <SafeIcon icon={FiCheck} className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Priority AI processing</span>
                </div>
              </div>

              {/* Subscribe button */}
              <motion.button
                onClick={handleSubscribe}
                disabled={loading}
                whileHover={!loading ? { scale: 1.02 } : {}}
                whileTap={!loading ? { scale: 0.98 } : {}}
                className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-4 rounded-xl font-semibold text-lg hover:from-primary-700 hover:to-secondary-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <SafeIcon icon={FiCreditCard} className="w-5 h-5" />
                <span>
                  {loading ? 'Processing...' : 'Subscribe Now'}
                </span>
              </motion.button>

              {/* Security note */}
              <p className="text-center text-xs text-gray-500 mt-4">
                Secure payment powered by Stripe • Cancel anytime
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default PaywallModal