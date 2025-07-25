import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { usePoems } from '../../hooks/usePoems'
import PoemDisplay from '../PoemGenerator/PoemDisplay'
import SafeIcon from '../../common/SafeIcon'
import * as FiIcons from 'react-icons/fi'

const { FiBook, FiSearch, FiFilter, FiCalendar } = FiIcons

const PoemLibrary = () => {
  const { poems, loading, deletePoem } = usePoems()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')

  const filteredPoems = poems.filter(poem => {
    const matchesSearch = poem.description_input.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         poem.generated_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         poem.poem_type.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterType === 'all' || poem.poem_type === filterType
    
    return matchesSearch && matchesFilter
  })

  const poemTypes = [...new Set(poems.map(poem => poem.poem_type))]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center">
            <SafeIcon icon={FiBook} className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Your Poem Library</h2>
            <p className="text-gray-600">{poems.length} poems created</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <SafeIcon icon={FiSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search poems..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div className="relative">
            <SafeIcon icon={FiFilter} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white min-w-[150px]"
            >
              <option value="all">All Types</option>
              {poemTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {filteredPoems.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 bg-white rounded-2xl shadow-xl"
        >
          <SafeIcon icon={FiBook} className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {searchTerm || filterType !== 'all' ? 'No poems found' : 'No poems yet'}
          </h3>
          <p className="text-gray-600">
            {searchTerm || filterType !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Create your first poem to get started'
            }
          </p>
        </motion.div>
      ) : (
        <div className="grid gap-6">
          {filteredPoems.map((poem, index) => (
            <motion.div
              key={poem.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <PoemDisplay 
                poem={poem} 
                onDelete={deletePoem}
                showActions={true}
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

export default PoemLibrary