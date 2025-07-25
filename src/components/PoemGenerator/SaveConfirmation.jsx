import React from 'react'
import { motion } from 'framer-motion'
import SafeIcon from '../../common/SafeIcon'
import * as FiIcons from 'react-icons/fi'

const { FiCheckCircle } = FiIcons

const SaveConfirmation = ({ visible, onAnimationComplete }) => {
  if (!visible) return null
  
  return (
    <motion.div 
      className="fixed bottom-6 right-6 bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 z-50"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
      onAnimationComplete={onAnimationComplete}
    >
      <SafeIcon icon={FiCheckCircle} className="w-5 h-5" />
      <span>Poem saved to My Collection!</span>
    </motion.div>
  )
}

export default SaveConfirmation