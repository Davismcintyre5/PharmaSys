import React, { useState } from 'react';
import axios from 'axios';

const PrescriptionUpload = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('prescription', file);
    const res = await axios.post('/api/prescriptions/upload', formData);
    onUploadSuccess(res.data);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <button type="submit">Upload</button>
    </form>
  );
};

export default PrescriptionUpload;