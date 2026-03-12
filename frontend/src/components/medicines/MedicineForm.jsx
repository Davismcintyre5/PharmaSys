import React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const MedicineForm = ({ initialValues, onSubmit, onCancel }) => {
  const formik = useFormik({
    initialValues: initialValues || { name: '', price: '', stock: '', reorderLevel: '' },
    validationSchema: Yup.object({
      name: Yup.string().required('Required'),
      price: Yup.number().positive().required('Required'),
      stock: Yup.number().integer().min(0).required('Required'),
    }),
    onSubmit: (values) => onSubmit(values),
  });

  return (
    <form onSubmit={formik.handleSubmit}>
      <div>
        <label>Name</label>
        <input {...formik.getFieldProps('name')} />
        {formik.touched.name && formik.errors.name && <div>{formik.errors.name}</div>}
      </div>
      <div>
        <label>Price</label>
        <input type="number" {...formik.getFieldProps('price')} />
        {formik.touched.price && formik.errors.price && <div>{formik.errors.price}</div>}
      </div>
      <div>
        <label>Stock</label>
        <input type="number" {...formik.getFieldProps('stock')} />
        {formik.touched.stock && formik.errors.stock && <div>{formik.errors.stock}</div>}
      </div>
      <div>
        <label>Reorder Level</label>
        <input type="number" {...formik.getFieldProps('reorderLevel')} />
      </div>
      <button type="submit">Submit</button>
      <button type="button" onClick={onCancel}>Cancel</button>
    </form>
  );
};

export default MedicineForm;