import React from 'react'
import {motion} from 'framer-motion'
import SafeIcon from '../../common/SafeIcon'
import * as FiIcons from 'react-icons/fi'

const {FiCheck, FiStar} = FiIcons

const PricingCard = ({plan, isPopular = false, onSelect}) => {
  const handleClick = () => {
    if (plan.paymentLink) {
      window.open(plan.paymentLink, '_blank')
    }
    onSelect && onSelect(plan)
  }

  return (
    <motion.div
      initial={{opacity: 0, y: 20}}
      animate={{opacity: 1, y: 0}}
      whileHover={{y: -5}}
      className={`relative bg-white rounded-2xl shadow-xl overflow-hidden border-2 transition-all duration-300 ${
        isPopular 
          ? 'border-primary-500 ring-4 ring-primary-100' 
          : 'border-gray-200 hover:border-primary-300'
      }`}
    >
      {isPopular && (
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-primary-600 to-secondary-600 text-white text-center py-2 text-sm font-medium">
          <SafeIcon icon={FiStar} className="w-4 h-4 inline mr-1" />
          Most Popular
        </div>
      )}
      
      <div className={`p-8 ${isPopular ? 'pt-16' : ''}`}>
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {plan.name}
          </h3>
          <div className="flex items-center justify-center mb-4">
            <span className="text-4xl font-bold text-gray-900">
              ${plan.amount}
            </span>
            <span className="text-gray-500 ml-2">
              /{plan.interval}
            </span>
          </div>
          <p className="text-gray-600">
            Perfect for unlimited poetry creation
          </p>
        </div>

        <div className="space-y-4 mb-8">
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

        <motion.button
          onClick={handleClick}
          whileHover={{scale: 1.02}}
          whileTap={{scale: 0.98}}
          className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-200 ${
            isPopular
              ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white hover:from-primary-700 hover:to-secondary-700 shadow-lg'
              : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
          }`}
        >
          Get Started
        </motion.button>
      </div>
    </motion.div>
  )
}

export default PricingCard