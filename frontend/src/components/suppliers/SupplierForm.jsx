import React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const SupplierForm = ({ initialValues, onSubmit, onCancel }) => {
  const formik = useFormik({
    initialValues: initialValues || { name: '', contactPerson: '', phone: '', email: '', address: '' },
    validationSchema: Yup.object({
      name: Yup.string().required('Required'),
      phone: Yup.string().required('Required'),
      email: Yup.string().email('Invalid email'),
    }),
    onSubmit: (values) => onSubmit(values),
  });

  return (
    <form onSubmit={formik.handleSubmit}>
      <div className="form-group">
        <label>Company Name</label>
        <input {...formik.getFieldProps('name')} />
        {formik.touched.name && formik.errors.name && <div className="error">{formik.errors.name}</div>}
      </div>
      <div className="form-group">
        <label>Contact Person</label>
        <input {...formik.getFieldProps('contactPerson')} />
      </div>
      <div className="form-group">
        <label>Phone</label>
        <input {...formik.getFieldProps('phone')} />
        {formik.touched.phone && formik.errors.phone && <div className="error">{formik.errors.phone}</div>}
      </div>
      <div className="form-group">
        <label>Email</label>
        <input type="email" {...formik.getFieldProps('email')} />
        {formik.touched.email && formik.errors.email && <div className="error">{formik.errors.email}</div>}
      </div>
      <div className="form-group">
        <label>Address</label>
        <textarea {...formik.getFieldProps('address')} rows="3" />
      </div>
      <button type="submit" className="success">Save</button>
      <button type="button" className="secondary" onClick={onCancel}>Cancel</button>
    </form>
  );
};

export default SupplierForm;