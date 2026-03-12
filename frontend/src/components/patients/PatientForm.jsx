import React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const PatientForm = ({ initialValues, onSubmit, onCancel }) => {
  const formik = useFormik({
    initialValues: initialValues || { name: '', phone: '', email: '', address: '' },
    validationSchema: Yup.object({
      name: Yup.string().required('Required'),
      phone: Yup.string().required('Required'),
      email: Yup.string().email(),
    }),
    onSubmit,
  });

  return (
    <form onSubmit={formik.handleSubmit}>
      <div><label>Name</label><input {...formik.getFieldProps('name')} /></div>
      <div><label>Phone</label><input {...formik.getFieldProps('phone')} /></div>
      <div><label>Email</label><input {...formik.getFieldProps('email')} /></div>
      <div><label>Address</label><input {...formik.getFieldProps('address')} /></div>
      <button type="submit">Save</button>
      <button type="button" onClick={onCancel}>Cancel</button>
    </form>
  );
};

export default PatientForm;