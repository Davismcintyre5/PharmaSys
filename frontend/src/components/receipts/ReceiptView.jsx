import React, { useEffect, useState } from 'react'
import { getReceiptHtml } from '../../services/receiptService'
import { printHtml } from '../../utils/printHelper'
import LoadingSpinner from '../common/LoadingSpinner'

const ReceiptView = ({ transactionId, onClose }) => {
  const [html, setHtml] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        const data = await getReceiptHtml(transactionId)
        setHtml(data)
      } catch (error) {
        console.error('Failed to fetch receipt:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchReceipt()
  }, [transactionId])

  const handlePrint = () => {
    printHtml(html)
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Receipt Preview</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">&times;</button>
        </div>
        <div className="border p-4 mb-4 max-h-96 overflow-auto">
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </div>
        <div className="flex justify-end space-x-2">
          <button
            onClick={handlePrint}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Print Receipt
          </button>
          <button
            onClick={onClose}
            className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default ReceiptView