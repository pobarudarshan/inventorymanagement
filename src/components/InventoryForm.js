import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Button, Card, Alert, InputGroup } from 'react-bootstrap';
import axios from 'axios';

const InventoryForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    quantity: '',
    description: '',
    tags: ''
  });
  
  // Add a separate state for new category input
  const [newCategory, setNewCategory] = useState('');
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [categories, setCategories] = useState([]);
  
  const { name, category, price, quantity, description, tags } = formData;
  
  // Fetch item data if editing
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/inventory/categories/all', {
          headers: { 'x-auth-token': token }
        });
        setCategories(res.data);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    
    fetchCategories();
    
    if (isEditing) {
      const fetchItem = async () => {
        try {
          setFetchLoading(true);
          const token = localStorage.getItem('token');
          const res = await axios.get(`/api/inventory/${id}`, {
            headers: { 'x-auth-token': token }
          });
          
          const item = res.data;
          setFormData({
            name: item.name,
            category: item.category,
            price: item.price,
            quantity: item.quantity,
            description: item.description,
            tags: item.tags ? item.tags.join(', ') : ''
          });
        } catch (err) {
          console.error('Error fetching item:', err);
          setError('Failed to load item data');
        } finally {
          setFetchLoading(false);
        }
      };
      
      fetchItem();
    }
  }, [id, isEditing]);
  
  const onChange = e => {
    const { name, value } = e.target;
    
    // Handle the category dropdown change
    if (name === 'category' && value === 'new') {
      setIsAddingNewCategory(true);
    } else if (name === 'category' && isAddingNewCategory) {
      setIsAddingNewCategory(false);
    }
    
    setFormData({ ...formData, [name]: value });
  };
  
  // Separate handler for new category input
  const onNewCategoryChange = e => {
    setNewCategory(e.target.value);
  };
  
  const onSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Process tags into array
      const formattedTags = tags
        ? tags.split(',').map(tag => tag.trim()).filter(tag => tag)
        : [];
      
      const itemData = {
        name,
        // Use the new category value if adding a new category
        category: isAddingNewCategory ? newCategory : category,
        price: parseFloat(price),
        quantity: parseInt(quantity, 10),
        description,
        tags: formattedTags
      };
      
      if (isEditing) {
        await axios.put(`/api/inventory/${id}`, itemData, {
          headers: { 'x-auth-token': token }
        });
        setSuccess('Item updated successfully!');
      } else {
        await axios.post('/api/inventory', itemData, {
          headers: { 'x-auth-token': token }
        });
        setSuccess('Item added successfully!');
        // Clear form after adding
        setFormData({
          name: '',
          category: '',
          price: '',
          quantity: '',
          description: '',
          tags: ''
        });
        setNewCategory('');
        setIsAddingNewCategory(false);
      }
    } catch (err) {
      console.error('Error:', err);
      setError(
        err.response?.data?.msg || 
        err.response?.data?.errors?.[0]?.msg || 
        'Something went wrong'
      );
    } finally {
      setLoading(false);
    }
  };
  
  const handleCancel = () => {
    navigate('/');
  };
  
  if (fetchLoading) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <h1 className="mb-4">{isEditing ? 'Edit Inventory Item' : 'Add New Inventory Item'}</h1>
      
      <Card className="shadow-sm">
        <Card.Body className="p-4">
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          
          <Form onSubmit={onSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Item name"
                name="name"
                value={name}
                onChange={onChange}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Category</Form.Label>
              <Form.Control
                as="select"
                name="category"
                value={isAddingNewCategory ? 'new' : category}
                onChange={onChange}
                required={!isAddingNewCategory}
              >
                <option value="">Select a category</option>
                {categories.map((cat, index) => (
                  <option key={index} value={cat}>{cat}</option>
                ))}
                <option value="new">+ Add New Category</option>
              </Form.Control>
            </Form.Group>
            
            {isAddingNewCategory && (
              <Form.Group className="mb-3">
                <Form.Label>New Category</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter new category"
                  name="newCategory"
                  value={newCategory}
                  onChange={onNewCategoryChange}
                  required
                />
              </Form.Group>
            )}
            
            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Price</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>$</InputGroup.Text>
                    <Form.Control
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      name="price"
                      value={price}
                      onChange={onChange}
                      required
                    />
                  </InputGroup>
                </Form.Group>
              </div>
              
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Quantity</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    placeholder="0"
                    name="quantity"
                    value={quantity}
                    onChange={onChange}
                    required
                  />
                </Form.Group>
              </div>
            </div>
            
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Item description"
                name="description"
                value={description}
                onChange={onChange}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Tags (comma separated)</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. electronics, gadget, sale"
                name="tags"
                value={tags}
                onChange={onChange}
              />
              <Form.Text className="text-muted">
                Separate tags with commas to make your items easier to find
              </Form.Text>
            </Form.Group>
            
            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button variant="secondary" onClick={handleCancel}>
                Cancel
              </Button>
              <Button 
                variant="primary" 
                type="submit" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    {isEditing ? 'Updating...' : 'Saving...'}
                  </>
                ) : (
                  isEditing ? 'Update Item' : 'Add Item'
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </>
  );
};

export default InventoryForm;