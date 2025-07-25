import React from 'react'
import {motion} from 'framer-motion'
import SafeIcon from '../../common/SafeIcon'
import * as FiIcons from 'react-icons/fi'

const {FiCheckCircle, FiX}=FiIcons

const SaveConfirmation=({visible, onAnimationComplete, message, type="success", dismissible=false, onDismiss})=> {
  if (!visible) return null
  
  const bgColor = type === "success" 
    ? "bg-gradient-to-r from-primary-600 to-secondary-600" 
    : "bg-gradient-to-r from-green-600 to-teal-600"
  
  return (
    <motion.div 
      className={`fixed bottom-6 right-6 ${bgColor} text-white px-5 py-4 rounded-lg shadow-lg flex items-center z-50 ${dismissible ? 'pr-12' : ''}`}
      initial={{opacity: 0, y: 20}}
      animate={{opacity: 1, y: 0}}
      exit={{opacity: 0, y: 20}}
      transition={{duration: 0.3}}
      onAnimationComplete={onAnimationComplete}
    >
      <SafeIcon icon={FiCheckCircle} className="w-5 h-5 mr-3 flex-shrink-0" />
      <span>{message || "Poem saved to My Collection!"}</span>
      
      {dismissible && onDismiss && (
        <button 
          onClick={onDismiss}
          className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded-full transition-colors"
        >
          <SafeIcon icon={FiX} className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  )
}

export default SaveConfirmation