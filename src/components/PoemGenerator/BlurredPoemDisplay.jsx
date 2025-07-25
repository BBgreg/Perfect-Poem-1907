import React from 'react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import SafeIcon from '../../common/SafeIcon'
import * as FiIcons from 'react-icons/fi'

const { FiBookOpen, FiLock } = FiIcons

const BlurredPoemDisplay = ({ poem, onUnlock }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-xl overflow-hidden relative"
    >
      <div className="bg-gradient-to-r from-primary-600 to-secondary-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <SafeIcon icon={FiBookOpen} className="w-6 h-6 text-white" />
            <div>
              <h3 className="text-lg font-semibold text-white">{poem.poem_type}</h3>
              <p className="text-primary-100 text-sm">
                Created {format(new Date(poem.created_at), 'PPP')}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Blurred Content */}
      <div className="p-8 relative">
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-500 mb-2">Theme</h4>
          <p className="text-gray-700 bg-gray-100 rounded-lg p-3">
            {poem.description_input}
          </p>
        </div>
        
        <div className="mb-6 relative">
          <h4 className="text-sm font-medium text-gray-500 mb-4">Your Poem</h4>
          <div className="bg-white rounded-xl p-6 border-2 border-gray-100 relative">
            <pre className="font-serif text-lg leading-relaxed text-gray-800 whitespace-pre-wrap blur-[6px] select-none">
              {poem.generated_text}
            </pre>
            
            {/* Lock Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-primary-500/60 to-secondary-500/60 backdrop-blur-sm rounded-xl">
              <div className="bg-white rounded-full p-4 mb-4">
                <SafeIcon icon={FiLock} className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Unlock Your Poem</h3>
              <p className="text-white/90 text-center mb-4 max-w-xs">
                Sign in or create an account to view and save your perfect poem
              </p>
              <button 
                onClick={onUnlock}
                className="px-6 py-3 bg-white text-primary-700 rounded-lg font-medium hover:bg-gray-50 transition-colors shadow-lg"
              >
                Unlock Now
              </button>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm blur-[4px]">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-gray-500 font-medium">Type</p>
            <p className="text-gray-900">{poem.poem_type}</p>
          </div>
          {poem.rhyme_pattern && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-gray-500 font-medium">Rhyme</p>
              <p className="text-gray-900">{poem.rhyme_pattern}</p>
            </div>
          )}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-gray-500 font-medium">Lines</p>
            <p className="text-gray-900">{poem.line_count_requested || 'AI decided'}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-gray-500 font-medium">Length</p>
            <p className="text-gray-900">{poem.line_length_requested}</p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default BlurredPoemDisplay