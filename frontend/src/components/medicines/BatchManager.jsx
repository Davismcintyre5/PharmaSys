import React, { useState } from 'react';

const BatchManager = ({ batches, onAddBatch }) => {
  const [batchNo, setBatchNo] = useState('');
  const [expiry, setExpiry] = useState('');
  const [quantity, setQuantity] = useState('');

  const handleAdd = () => {
    onAddBatch({ batchNo, expiry, quantity: parseInt(quantity) });
    setBatchNo('');
    setExpiry('');
    setQuantity('');
  };

  return (
    <div>
      <h4>Batches</h4>
      <ul>
        {batches.map((b, idx) => (
          <li key={idx}>{b.batchNo} - Exp: {b.expiry} - Qty: {b.quantity}</li>
        ))}
      </ul>
      <div>
        <input placeholder="Batch No" value={batchNo} onChange={(e) => setBatchNo(e.target.value)} />
        <input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
        <input type="number" placeholder="Quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        <button onClick={handleAdd}>Add Batch</button>
      </div>
    </div>
  );
};

export default BatchManager;