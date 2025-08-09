import React from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { supabase } from './utils/supabaseClient';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import logo from "./public/logosaparktrack.png";

const Register = () => {
  const navigate = useNavigate();

  const initialValues = {
    studentId: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    motorcycleModel: '',  // Changed from plateNumber to motorcycleModel
    motorcycleColorway: '',  // New field for motorcycle colorway
    contactNumber: '',  // New field for contact number
  };

  const validationSchema = Yup.object({
    studentId: Yup.string()
      .matches(/^[0-9]{10}$/, 'Student ID must be exactly 10 digits')
      .required('Student ID is required'),
    name: Yup.string().required('Full name is required'),
    email: Yup.string()
      .email('Invalid email format')
      .required('Required')
      .notOneOf(['admin@gmail.com'], 'This email is not allowed'),
    password: Yup.string().min(6, 'Password must be at least 6 characters long').required('Password is required'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password'), null], 'Passwords must match')
      .required('Confirm password is required'),
    motorcycleModel: Yup.string()
      .matches(/^[A-Za-z0-9\s]{1,30}$/, 'Motorcycle model must be alphanumeric and up to 30 characters')
      .required('Motorcycle model is required'),  
    motorcycleColorway: Yup.string()
      .matches(/^[A-Za-z\s]{1,30}$/, 'Motorcycle colorway must be alphabetic and up to 30 characters')
      .required('Motorcycle colorway is required'),  
    contactNumber: Yup.string()
      .matches(/^[0-9]{10,11}$/, 'Contact number must be 10 or 11 digits')
      .required('Contact number is required'),  
  });

  const onSubmit = async (values) => {
    try {
      
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            studentId: values.studentId,
            name: values.name,
            motorcycleModel: values.motorcycleModel,  
            motorcycleColorway: values.motorcycleColorway,  
            contactNumber: values.contactNumber,  
          },
        },
      });

      if (error) {
        console.error('Error signing up:', error.message);
        toast.error(`Error: ${error.message}`);
        return;
      }

      
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: data.user.id,             
            student_id: values.studentId,  
            name: values.name,             
            email: values.email,           
            password: values.password,
            motorcycle_model: values.motorcycleModel,  
            motorcycle_colorway: values.motorcycleColorway,  
            contact_number: values.contactNumber,  
          },
        ]);

      if (profileError) {
        console.error('Error inserting profile data:', profileError.message);
        toast.error(`Error saving profile data: ${profileError.message}`);
        return;
      }

      toast.success('Registration successful! Please check your email to confirm your account.', {
        onClose: () => navigate('/login') 
      });
    } catch (error) {
      console.error('Error during sign up:', error.message);
      toast.error(`Error: ${error.message}`);
    }
  };

  return (
    <div className="register1-page">
      <h1 className="login1-title"><
        img src={logo} alt="ParkTrack Logo" className="parktrack-logo" />
       PARKTRACK
      </h1>
      
      <ToastContainer />
      <div className="register1-container">
        <h2 className="register1-header">Register</h2>
        <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={onSubmit}>
          <Form className="register1-form">
            <div className="register1-form-group">
              <label className="register1-form-label">Student ID</label>
              <Field 
                name="studentId" 
                className="register1-form-input" 
                type="text" 
                onKeyPress={(event) => {
                  if (!/[0-9]/.test(event.key) && event.key !== 'Backspace') {
                    event.preventDefault();
                  }
                }} 
              />
              <ErrorMessage name="studentId" component="div" className="register1-error-message" />
            </div>
            <div className="register1-form-group">
              <label className="register1-form-label">Full Name</label>
              <Field name="name" className="register1-form-input" />
              <ErrorMessage name="name" component="div" className="register1-error-message" />
            </div>
            <div className="register1-form-group">
              <label className="register1-form-label">Email</label>
              <Field type="email" name="email" className="register1-form-input" />
              <ErrorMessage name="email" component="div" className="register1-error-message" />
            </div>
            <div className="register1-form-group">
              <label className="register1-form-label">Password</label>
              <Field type="password" name="password" className="register1-form-input" />
              <ErrorMessage name="password" component="div" className="register1-error-message" />
            </div>
            <div className="register1-form-group">
              <label className="register1-form-label">Confirm Password</label>
              <Field type="password" name="confirmPassword" className="register1-form-input" />
              <ErrorMessage name="confirmPassword" component="div" className="register1-error-message" />
            </div>
            <div className="register1-form-group">
              <label className="register1-form-label">Motorcycle Model</label>
              <Field name="motorcycleModel" className="register1-form-input" />
              <ErrorMessage name="motorcycleModel" component="div" className="register1-error-message" />
            </div>
            <div className="register1-form-group">
              <label className="register1-form-label">Motorcycle Colorway</label>
              <Field name="motorcycleColorway" className="register1-form-input" />
              <ErrorMessage name="motorcycleColorway" component="div" className="register1-error-message" />
            </div>
            <div className="register1-form-group">
              <label className="register1-form-label">Contact Number</label>
              <Field 
                name="contactNumber" 
                className="register1-form-input" 
                maxLength="11"  
                onKeyPress={(event) => {
                  if (!/[0-9]/.test(event.key) && event.key !== 'Backspace') {
                    event.preventDefault();
                  }
                }} 
              />
              <ErrorMessage name="contactNumber" component="div" className="register1-error-message" />
            </div>
            <div className="register1-button-group">
              
              <button type="button" className="register1-register-button" onClick={() => navigate('/Login')}>Back to Login</button>
              <button type="submit" className="register1-submit-button">Register</button>
            </div>
          </Form>
        </Formik>
      </div>
    </div>
  );
};

export default Register;
