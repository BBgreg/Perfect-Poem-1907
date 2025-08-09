import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import SafeIcon from '../../common/SafeIcon'
import * as FiIcons from 'react-icons/fi'

const { FiEdit3, FiZap, FiAlertCircle, FiRefreshCw, FiInfo, FiLock } = FiIcons

const PoemForm = ({ onGenerate, loading, error, onRetry, canGenerate = true }) => {
  const [formData, setFormData] = useState({
    poemType: 'Free Verse',
    rhymePattern: 'None (Free Verse)',
    description: '',
    lineCount: '',
    lineLength: 'Medium'
  })
  
  const [showInfoPopup, setShowInfoPopup] = useState(null)
  const [isLineCountLocked, setIsLineCountLocked] = useState(false)
  const [lineCountPlaceholder, setLineCountPlaceholder] = useState(
    "Enter number (e.g., 10, 8-12) or leave blank"
  )

  const poemTypes = [
    'Free Verse', 'Sonnet', 'Haiku', 'Limerick', 'Ballad', 'Acrostic', 
    'Cinquain', 'Villanelle', 'Couplet', 'Ode'
  ]
  
  const poemTypeDescriptions = {
    'Free Verse': 'Poetry without regular rhyme or rhythm, allowing creative expression.',
    'Sonnet': 'A 14-line poem with specific rhyme schemes, often about love or beauty.',
    'Haiku': 'A traditional Japanese poem with 3 lines following a 5-7-5 syllable pattern.',
    'Limerick': 'A humorous 5-line poem with an AABBA rhyme scheme.',
    'Ballad': 'A narrative poem that tells a story, often set to music.',
    'Acrostic': 'A poem where the first letters of each line spell out a word or phrase.',
    'Cinquain': 'A 5-line poem with a specific syllable pattern (2-4-6-8-2).',
    'Villanelle': 'A 19-line poem with a complex rhyme scheme and repeated refrains.',
    'Couplet': 'A pair of lines of metre in poetry, usually rhyming and of the same metre.',
    'Ode': 'A lyrical stanza or poem of elaborate or irregular metrical structure, expressing praise or glorification.'
  }

  const rhymePatterns = [
    { value: 'None (Free Verse)', label: 'No specific pattern' },
    { value: 'ABAB', label: 'ABAB (Alternating)' },
    { value: 'AABB', label: 'AABB (Couplets)' },
    { value: 'ABCB', label: 'ABCB (Ballad meter)' },
    { value: 'ABABCDCDEFEFGG', label: 'Shakespearean Sonnet' },
    { value: 'ABBAABBACDECDE', label: 'Petrarchan Sonnet' },
    { value: 'AABBA', label: 'AABBA (Limerick)' },
    { value: 'ABA', label: 'ABA (Villanelle)' },
    { value: 'AABB (Couplet)', label: 'AABB (Couplet)' },
    { value: 'Random (AI Chooses)', label: 'Random (AI Chooses)' }
  ]

  const lineLengths = ['Short', 'Medium', 'Long']

  // Auto-select appropriate settings based on poem type
  useEffect(() => {
    let newFormData = { ...formData }
    let lockLineCount = false
    let newPlaceholder = "Enter number (e.g., 10, 8-12) or leave blank"

    switch (formData.poemType) {
      case 'Sonnet':
        newFormData.rhymePattern = 'ABABCDCDEFEFGG'
        newFormData.lineCount = '14'
        lockLineCount = true
        break
      case 'Haiku':
        newFormData.rhymePattern = 'None (Free Verse)'
        newFormData.lineCount = '3'
        lockLineCount = true
        break
      case 'Limerick':
        newFormData.rhymePattern = 'AABBA'
        newFormData.lineCount = '5'
        lockLineCount = true
        break
      case 'Cinquain':
        newFormData.rhymePattern = 'None (Free Verse)'
        newFormData.lineCount = '5'
        lockLineCount = true
        break
      case 'Villanelle':
        newFormData.rhymePattern = 'ABA'
        newFormData.lineCount = '19'
        lockLineCount = true
        break
      case 'Couplet':
        newFormData.rhymePattern = 'AABB (Couplet)'
        newPlaceholder = "Enter an even number (e.g., 2, 4, 10) or leave blank"
        newFormData.lineLength = 'Medium'
        lockLineCount = false
        break
      case 'Ode':
        newFormData.rhymePattern = 'None (Free Verse)'
        newFormData.lineCount = ''
        newFormData.lineLength = 'Medium'
        lockLineCount = false
        break
      case 'Free Verse':
      case 'Ballad':
      case 'Acrostic':
        newFormData.rhymePattern = 'None (Free Verse)'
        lockLineCount = false
        break
      default:
        lockLineCount = false
    }

    setFormData(newFormData)
    setIsLineCountLocked(lockLineCount)
    setLineCountPlaceholder(newPlaceholder)
  }, [formData.poemType])

  const handleSubmit = (e) => {
    e.preventDefault()

    // Ensure rhymePattern is never an empty string before submission
    const finalFormData = {
      ...formData,
      rhymePattern: formData.rhymePattern || 'None (Free Verse)'
    }

    // Add comprehensive form data logging
    console.log('Perfect Poem: PoemForm submitting with form data:', finalFormData)
    console.log('Perfect Poem: Form data validation:')
    console.log(' - poemType:', finalFormData.poemType, '(type:', typeof finalFormData.poemType, ')')
    console.log(' - rhymePattern:', finalFormData.rhymePattern, '(type:', typeof finalFormData.rhymePattern, ')')
    console.log(' - description:', finalFormData.description, '(type:', typeof finalFormData.description, ')')
    console.log(' - lineCount:', finalFormData.lineCount, '(type:', typeof finalFormData.lineCount, ')')
    console.log(' - lineLength:', finalFormData.lineLength, '(type:', typeof finalFormData.lineLength, ')')

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

  const handleInfoClick = (poemType) => {
    setShowInfoPopup(showInfoPopup === poemType ? null : poemType)
  }

  const getButtonText = () => {
    if (loading) return 'Crafting Your Perfect Poem...'
    if (error) return 'Try Again'
    return 'Craft My Perfect Poem'
  }

  const getButtonDisabled = () => {
    return loading || !formData.description.trim()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-xl p-8 relative"
    >
      <div className="flex items-center space-x-3 mb-8">
        <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center">
          <SafeIcon icon={FiEdit3} className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Create Your Poem</h2>
          <p className="text-gray-600">
            Describe your vision and let AI craft the perfect verses
          </p>
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

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Choose Your Canvas Section */}
        <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Your Canvas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative">
              <div className="flex items-center space-x-2 mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Poem Type
                </label>
                <button
                  type="button"
                  onClick={() => handleInfoClick('poemTypes')}
                  className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <SafeIcon icon={FiInfo} className="w-4 h-4 text-gray-500" />
                </button>
              </div>
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

              {/* Info Popup */}
              {showInfoPopup === 'poemTypes' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-10"
                >
                  <h4 className="font-semibold text-gray-900 mb-2">{formData.poemType}</h4>
                  <p className="text-sm text-gray-600">{poemTypeDescriptions[formData.poemType]}</p>
                </motion.div>
              )}
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
          </div>
        </div>

        {/* Shape Your Verse Section */}
        <div className="bg-gradient-to-r from-secondary-50 to-primary-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Shape Your Verse</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative">
              <div className="flex items-center space-x-2 mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Total Lines
                </label>
                {isLineCountLocked && (
                  <SafeIcon icon={FiLock} className="w-4 h-4 text-gray-500" />
                )}
              </div>
              <input
                type="text"
                value={formData.lineCount}
                onChange={(e) => handleChange('lineCount', e.target.value)}
                placeholder={lineCountPlaceholder}
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${isLineCountLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                disabled={loading || isLineCountLocked}
                readOnly={isLineCountLocked}
              />
              <p className="text-xs text-gray-500 mt-1">
                {isLineCountLocked ? 
                  `Locked to ${formData.lineCount} lines for ${formData.poemType}` : 
                  formData.poemType === 'Couplet' ?
                    'For couplets, consider using even numbers for balanced pairs' :
                    'Enter the approximate length for your poem or leave it blank and let AI decide'
                }
              </p>
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
        </div>

        {/* Inspiration Section */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Inspiration</h3>
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
        </div>

        <motion.button
          type="submit"
          disabled={getButtonDisabled()}
          whileHover={!getButtonDisabled() ? { scale: 1.02 } : {}}
          whileTap={!getButtonDisabled() ? { scale: 0.98 } : {}}
          className={`w-full py-4 rounded-xl font-medium text-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 bg-gradient-to-r from-primary-600 to-secondary-600 text-white hover:from-primary-700 hover:to-secondary-700`}
        >
          <SafeIcon
            icon={loading ? FiRefreshCw : (error ? FiRefreshCw : FiZap)}
            className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`}
          />
          <span>{getButtonText()}</span>
        </motion.button>
      </form>

      {/* Click outside to close popup */}
      {showInfoPopup && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setShowInfoPopup(null)}
        />
      )}
    </motion.div>
  )
}

export default PoemForm