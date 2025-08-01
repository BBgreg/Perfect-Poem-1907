import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import SafeIcon from '../../common/SafeIcon'
import * as FiIcons from 'react-icons/fi'

const { FiBookOpen, FiCopy, FiDownload, FiHeart, FiShare2, FiEdit2, FiTrash2 } = FiIcons

const PoemDisplay = ({ poem, onSave, onDelete, showActions = true }) => {
  const [copied, setCopied] = useState(false)
  const [liked, setLiked] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(poem.generated_text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text:', err)
    }
  }

  const handleDownload = () => {
    const content = `${poem.generated_text}\n\n---\nGenerated by Perfect Poem\nType: ${poem.poem_type}\nCreated: ${format(new Date(poem.created_at), 'PPP')}`
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `poem-${format(new Date(poem.created_at), 'yyyy-MM-dd')}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-xl overflow-hidden"
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
          
          {showActions && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setLiked(!liked)}
                className={`p-2 rounded-full transition-colors ${
                  liked ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                <SafeIcon icon={FiHeart} className="w-4 h-4" />
              </button>
              
              <button
                onClick={handleCopy}
                className="p-2 bg-white/20 text-white rounded-full hover:bg-white/30 transition-colors"
              >
                <SafeIcon icon={FiCopy} className="w-4 h-4" />
              </button>
              
              <button
                onClick={handleDownload}
                className="p-2 bg-white/20 text-white rounded-full hover:bg-white/30 transition-colors"
              >
                <SafeIcon icon={FiDownload} className="w-4 h-4" />
              </button>
              
              {onDelete && (
                <button
                  onClick={() => onDelete(poem.id)}
                  className="p-2 bg-white/20 text-white rounded-full hover:bg-red-500 transition-colors"
                >
                  <SafeIcon icon={FiTrash2} className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="p-8">
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-500 mb-2">Theme</h4>
          <p className="text-gray-700 bg-gray-100 rounded-lg p-3">
            {poem.description_input}
          </p>
        </div>

        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-500 mb-4">Your Poem</h4>
          <div className="bg-white rounded-xl p-6 border-2 border-gray-100">
            <pre className="font-serif text-lg leading-relaxed text-gray-800 whitespace-pre-wrap">
              {poem.generated_text}
            </pre>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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

        {copied && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 bg-green-100 border border-green-200 text-green-700 px-4 py-2 rounded-lg text-center"
          >
            Poem copied to clipboard!
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

export default PoemDisplay