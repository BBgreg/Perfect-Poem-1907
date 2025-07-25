import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import SafeIcon from '../../common/SafeIcon'
import * as FiIcons from 'react-icons/fi'

const { FiEdit3, FiZap, FiAlertCircle, FiRefreshCw } = FiIcons

const PoemForm = ({ onGenerate, loading, error, onRetry }) => {
  const [formData, setFormData] = useState({
    poemType: 'Free Verse',
    rhymePattern: 'None (Free Verse)', // Changed default from empty string to valid value
    description: '',
    lineCount: 'blank',
    lineLength: 'Medium'
  })

  const poemTypes = [
    'Free Verse',
    'Sonnet',
    'Haiku',
    'Limerick',
    'Ballad',
    'Acrostic',
    'Cinquain',
    'Villanelle'
  ]

  const rhymePatterns = [
    { value: 'None (Free Verse)', label: 'No specific pattern' }, // Changed from empty string to explicit value
    { value: 'ABAB', label: 'ABAB (Alternating)' },
    { value: 'AABB', label: 'AABB (Couplets)' },
    { value: 'ABCB', label: 'ABCB (Ballad meter)' },
    { value: 'ABABCDCDEFEFGG', label: 'Shakespearean Sonnet' },
    { value: 'ABBAABBACDECDE', label: 'Petrarchan Sonnet' }
  ]

  const lineCounts = [
    { value: 'blank', label: 'Let AI decide' },
    { value: '4', label: '4 lines (Quatrain)' },
    { value: '8', label: '8 lines (Octave)' },
    { value: '8-12', label: '8-12 lines' },
    { value: '14', label: '14 lines (Sonnet)' },
    { value: '16', label: '16 lines' }
  ]

  const lineLengths = ['Short', 'Medium', 'Long']

  // Auto-select appropriate rhyme scheme based on poem type
  useEffect(() => {
    if (formData.poemType === 'Sonnet') {
      setFormData(prev => ({ ...prev, rhymePattern: 'ABABCDCDEFEFGG' }));
    } else if (formData.poemType === 'Haiku' || formData.poemType === 'Free Verse' || formData.poemType === 'Acrostic') {
      setFormData(prev => ({ ...prev, rhymePattern: 'None (Free Verse)' }));
    } else if (formData.poemType === 'Limerick') {
      setFormData(prev => ({ ...prev, rhymePattern: 'AABBA' }));
    } else if (formData.poemType === 'Villanelle') {
      setFormData(prev => ({ ...prev, rhymePattern: 'ABA' }));
    }
    // Other poem types can keep the user's selection
  }, [formData.poemType]);

  const handleSubmit = (e) => {
    e.preventDefault()

    // Ensure rhymePattern is never an empty string before submission
    const finalFormData = {
      ...formData,
      rhymePattern: formData.rhymePattern || 'None (Free Verse)' // Fallback if somehow empty
    };

    // Add comprehensive form data logging
    console.log('Perfect Poem: PoemForm submitting with form data:', finalFormData)
    console.log('Perfect Poem: Form data validation:')
    console.log('  - poemType:', finalFormData.poemType, '(type:', typeof finalFormData.poemType, ')')
    console.log('  - rhymePattern:', finalFormData.rhymePattern, '(type:', typeof finalFormData.rhymePattern, ')')
    console.log('  - description:', finalFormData.description, '(type:', typeof finalFormData.description, ')')
    console.log('  - lineCount:', finalFormData.lineCount, '(type:', typeof finalFormData.lineCount, ')')
    console.log('  - lineLength:', finalFormData.lineLength, '(type:', typeof finalFormData.lineLength, ')')

    // Validate required fields
    if (!finalFormData.description || finalFormData.description.trim() === '') {
      console.error('Perfect Poem: Form validation failed - description is required')
      return
    }

    if (!finalFormData.poemType || finalFormData.poemType.trim() === '') {
      console.error('Perfect Poem: Form validation failed - poemType is required')
      return
    }

    if (onRetry) {
      onRetry()
    }
    onGenerate(finalFormData)
  }

  const handleChange = (field, value) => {
    console.log(`Perfect Poem: Form field changed - ${field}:`, value)
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-xl p-8"
    >
      <div className="flex items-center space-x-3 mb-8">
        <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center">
          <SafeIcon icon={FiEdit3} className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Create Your Poem</h2>
          <p className="text-gray-600">Describe your vision and let AI craft the perfect verses</p>
        </div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4"
        >
          <div className="flex items-start space-x-3">
            <SafeIcon icon={FiAlertCircle} className="w-5 h-5 text-red-500 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-red-800 mb-1">Generation Error</h4>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Poem Type
            </label>
            <select
              value={formData.poemType}
              onChange={(e) => handleChange('poemType', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={loading}
            >
              {poemTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rhyme Pattern
            </label>
            <select
              value={formData.rhymePattern}
              onChange={(e) => handleChange('rhymePattern', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={loading}
            >
              {rhymePatterns.map(pattern => (
                <option key={pattern.value} value={pattern.value}>
                  {pattern.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Lines
            </label>
            <select
              value={formData.lineCount}
              onChange={(e) => handleChange('lineCount', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={loading}
            >
              {lineCounts.map(count => (
                <option key={count.value} value={count.value}>
                  {count.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Line Length
            </label>
            <div className="grid grid-cols-3 gap-2">
              {lineLengths.map(length => (
                <button
                  key={length}
                  type="button"
                  onClick={() => handleChange('lineLength', length)}
                  disabled={loading}
                  className={`px-3 py-2 text-sm rounded-lg border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    formData.lineLength === length
                      ? 'bg-primary-100 border-primary-500 text-primary-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {length}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description / Theme
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Describe the theme, mood, or story you want your poem to capture..."
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            disabled={loading}
            required
          />
        </div>

        <motion.button
          type="submit"
          disabled={loading || !formData.description.trim()}
          whileHover={!loading ? { scale: 1.02 } : {}}
          whileTap={!loading ? { scale: 0.98 } : {}}
          className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-4 rounded-xl font-medium text-lg hover:from-primary-700 hover:to-secondary-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          <SafeIcon icon={loading ? FiRefreshCw : (error ? FiRefreshCw : FiZap)} className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          <span>
            {loading ? 'Crafting Your Perfect Poem...' : error ? 'Try Again' : 'Craft My Perfect Poem'}
          </span>
        </motion.button>
      </form>
    </motion.div>
  )
}

export default PoemForm