import React from 'react'

const PrintWrapper = ({ children, title = 'Print' }) => {
  const handlePrint = () => {
    window.print()
  }

  return (
    <div>
      <div className="hidden print:block">{children}</div>
      <div className="print:hidden">
        <button
          onClick={handlePrint}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Print
        </button>
      </div>
    </div>
  )
}

export default PrintWrapper