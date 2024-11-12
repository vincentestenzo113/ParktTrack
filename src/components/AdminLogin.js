// AdminLogin.js
import React from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { useNavigate } from 'react-router-dom';
import * as Yup from 'yup';
import { supabase } from './utils/supabaseClient';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AdminLogin = () => {
  const navigate = useNavigate();

  const initialValues = {
    email: '',
    password: '',
  };

  const validationSchema = Yup.object({
    email: Yup.string().email('Invalid email format').required('Required'),
    password: Yup.string().required('Password is required'),
  });

  const onSubmit = async (values, { setSubmitting }) => {
    const adminEmail = 'admin@gmail.com';
    if (values.email !== adminEmail) {
      toast.error('only admin can login here.');
      setSubmitting(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        console.error('Login error:', error.message);
        toast.error(`Login failed: ${error.message}`);
        return;
      }

      localStorage.setItem('isAuthenticated', 'true');

      // Redirecting to the admin dashboard after successful login
      toast.success('Login successful! Redirecting to admin page...');
      navigate('/admin');
    } catch (error) {
      console.error('Error during login:', error.message);
      toast.error(`Error: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login1-page">
      <ToastContainer />
      <h1 className="login1-title">PARKTRACK</h1>
      <div className="login1-container">
        <h2 className="login1-header">Admin Login</h2>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={onSubmit}
        >
          {({ isSubmitting }) => (
            <Form className="login1-form">
              <div className="login1-form-group">
                <label className="login1-form-label">Email</label>
                <Field type="email" name="email" className="login1-form-input" />
                <ErrorMessage name="email" component="div" className="login1-error-message" />
              </div>
              <div className="login1-form-group">
                <label className="login1-form-label">Password</label>
                <Field type="password" name="password" className="login1-form-input" />
                <ErrorMessage name="password" component="div" className="login1-error-message" />
              </div>
              <div className="login1-button-group">
                <button type="submit" className="login1-submit-button" disabled={isSubmitting}>
                  Login
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default AdminLogin;
