import React from 'react'
import {motion} from 'framer-motion'
import PricingCard from './PricingCard'
import SafeIcon from '../../common/SafeIcon'
import * as FiIcons from 'react-icons/fi'

const {FiDollarSign} = FiIcons

const PricingSection = () => {
  const pricingPlans = [
    {
      name: "Unlimited Perfect Poems",
      amount: 2.99,
      priceId: "price_1RozdEIa1WstuQNenABMe6HD",
      paymentLink: "https://buy.stripe.com/3cIbJ1fVgbBKfv01u41RC00",
      currency: "usd",
      interval: "month"
    }
  ]

  return (
    <div className="py-16 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{opacity: 0, y: 20}}
          animate={{opacity: 1, y: 0}}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full mb-6">
            <SafeIcon icon={FiDollarSign} className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Unlock unlimited poetry creation with our affordable monthly subscription. 
            Cancel anytime, no hidden fees.
          </p>
        </motion.div>

        <div className="flex justify-center">
          <div className="w-full max-w-sm">
            <PricingCard 
              plan={pricingPlans[0]}
              isPopular={true}
            />
          </div>
        </div>

        <motion.div
          initial={{opacity: 0, y: 20}}
          animate={{opacity: 1, y: 0}}
          transition={{delay: 0.4}}
          className="text-center mt-12"
        >
          <p className="text-gray-600 mb-4">
            All plans include a secure checkout powered by Stripe
          </p>
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
            <span>✓ Secure payments</span>
            <span>✓ Cancel anytime</span>
            <span>✓ 24/7 support</span>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default PricingSection