import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Button, Card, Alert } from 'react-bootstrap';
import axios from 'axios';

const Auth = ({ login, isRegister }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password2: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const { name, email, password, password2 } = formData;

  const onChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async e => {
    e.preventDefault();
    setError('');
    
    if (isRegister && password !== password2) {
      setError('Passwords do not match');
      return;
    }
    
    try {
      setLoading(true);
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const body = isRegister ? { name, email, password } : { email, password };
      
      const res = await axios.post(endpoint, body);
      login(res.data.token);
      navigate('/');
    } catch (err) {
      setError(
        err.response?.data?.msg || 
        err.response?.data?.errors?.[0]?.msg || 
        'Something went wrong'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-md-6">
        <Card className="shadow-sm">
          <Card.Body className="p-4">
            <h2 className="text-center mb-4">{isRegister ? 'Register' : 'Login'}</h2>
            
            {error && <Alert variant="danger">{error}</Alert>}
            
            <Form onSubmit={onSubmit}>
              {isRegister && (
                <Form.Group className="mb-3" controlId="name">
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter your name"
                    name="name"
                    value={name}
                    onChange={onChange}
                    required
                  />
                </Form.Group>
              )}
              
              <Form.Group className="mb-3" controlId="email">
                <Form.Label>Email Address</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="Enter your email"
                  name="email"
                  value={email}
                  onChange={onChange}
                  required
                />
              </Form.Group>
              
              <Form.Group className="mb-3" controlId="password">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Enter your password"
                  name="password"
                  value={password}
                  onChange={onChange}
                  required
                  minLength="6"
                />
              </Form.Group>
              
              {isRegister && (
                <Form.Group className="mb-3" controlId="password2">
                  <Form.Label>Confirm Password</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Confirm your password"
                    name="password2"
                    value={password2}
                    onChange={onChange}
                    required
                    minLength="6"
                  />
                </Form.Group>
              )}
              
              <Button 
                variant="primary" 
                type="submit" 
                className="w-100 mt-3" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    {isRegister ? 'Registering...' : 'Logging in...'}
                  </>
                ) : (
                  isRegister ? 'Register' : 'Login'
                )}
              </Button>
            </Form>
            
            <div className="text-center mt-3">
              {isRegister ? (
                <p>Already have an account? <Link to="/login">Login</Link></p>
              ) : (
                <p>Don't have an account? <Link to="/register">Register</Link></p>
              )}
            </div>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
};

export default Auth;