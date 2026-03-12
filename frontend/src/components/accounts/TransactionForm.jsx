import React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const TransactionForm = ({ initialValues, onSubmit, onCancel }) => {
  const formik = useFormik({
    initialValues: initialValues || { type: 'income', amount: '', description: '', date: new Date().toISOString().split('T')[0] },
    validationSchema: Yup.object({
      type: Yup.string().required('Required'),
      amount: Yup.number().positive().required('Required'),
      description: Yup.string().required('Required'),
      date: Yup.date().required('Required'),
    }),
    onSubmit: (values) => onSubmit(values),
  });

  return (
    <form onSubmit={formik.handleSubmit}>
      <div className="form-group">
        <label>Type</label>
        <select {...formik.getFieldProps('type')}>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
          <option value="withdrawal">Withdrawal</option>
        </select>
        {formik.touched.type && formik.errors.type && <div className="error">{formik.errors.type}</div>}
      </div>
      <div className="form-group">
        <label>Amount</label>
        <input type="number" step="0.01" {...formik.getFieldProps('amount')} />
        {formik.touched.amount && formik.errors.amount && <div className="error">{formik.errors.amount}</div>}
      </div>
      <div className="form-group">
        <label>Description</label>
        <input {...formik.getFieldProps('description')} />
        {formik.touched.description && formik.errors.description && <div className="error">{formik.errors.description}</div>}
      </div>
      <div className="form-group">
        <label>Date</label>
        <input type="date" {...formik.getFieldProps('date')} />
        {formik.touched.date && formik.errors.date && <div className="error">{formik.errors.date}</div>}
      </div>
      <button type="submit" className="success">Save</button>
      <button type="button" className="secondary" onClick={onCancel}>Cancel</button>
    </form>
  );
};

export default TransactionForm;