import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../../hooks/useAuth'
import AuthModal from '../Auth/AuthModal'
import SafeIcon from '../../common/SafeIcon'
import * as FiIcons from 'react-icons/fi'

const { FiFeather, FiUser, FiLogOut, FiExternalLink } = FiIcons

const Header = () => {
  const { user, signOut } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    setShowUserMenu(false)
  }

  return (
    <>
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.div
              className="flex items-center space-x-3"
              whileHover={{ scale: 1.02 }}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                <SafeIcon icon={FiFeather} className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                  Perfect Poem
                </h1>
                <p className="text-xs text-gray-500">AI Poetry Generator</p>
              </div>
            </motion.div>

            <div className="flex items-center space-x-4">
              {/* Promotional Button */}
              <motion.a
                href="https://ask4appco.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center space-x-1 px-3 py-1.5 bg-gradient-to-r from-primary-500 to-secondary-500 text-white text-xs font-medium rounded-lg hover:from-primary-600 hover:to-secondary-600 transition-all duration-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>Check out all my other apps on ask4appco.com</span>
                <SafeIcon icon={FiExternalLink} className="w-3 h-3" />
              </motion.a>

              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-3 bg-gray-50 hover:bg-gray-100 rounded-full px-4 py-2 transition-colors"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                      <SafeIcon icon={FiUser} className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {user.email}
                    </span>
                  </button>

                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2"
                    >
                      <button
                        onClick={handleSignOut}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                      >
                        <SafeIcon icon={FiLogOut} className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>

                      {/* Mobile Promotional Link */}
                      <a
                        href="https://ask4appco.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="sm:hidden w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                      >
                        <SafeIcon icon={FiExternalLink} className="w-4 h-4" />
                        <span>Check out my other apps</span>
                      </a>
                    </motion.div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  {/* Mobile Promotional Button */}
                  <motion.a
                    href="https://ask4appco.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sm:hidden flex items-center justify-center w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg hover:from-primary-600 hover:to-secondary-600 transition-all duration-200"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <SafeIcon icon={FiExternalLink} className="w-4 h-4" />
                  </motion.a>

                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    Sign In
                  </button>

                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="px-4 py-2 bg-gradient-to-r from-primary-600 to-secondary-600 text-white text-sm font-medium rounded-lg hover:from-primary-700 hover:to-secondary-700 transition-all duration-200"
                  >
                    Get Started
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  )
}

export default Header