import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Table, Button, Card, Form, InputGroup, Row, Col, Badge, Modal } from 'react-bootstrap';
import axios from 'axios';

const InventoryList = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState('createdAt:desc');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Fetch inventory items with search and filter
  const fetchInventory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Build query parameters
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (category) params.append('category', category);
      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);
      if (sort) params.append('sort', sort);
      
      const res = await axios.get(`/api/inventory?${params.toString()}`, {
        headers: { 'x-auth-token': token }
      });
      
      setInventory(res.data);
      setError('');
    } catch (err) {
      console.error('Error fetching inventory:', err);
      setError('Failed to load inventory items');
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories for filter dropdown
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

  useEffect(() => {
    fetchInventory();
    fetchCategories();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e) => {
    e.preventDefault();
    fetchInventory();
  };

  const resetFilters = () => {
    setSearch('');
    setCategory('');
    setMinPrice('');
    setMaxPrice('');
    setSort('createdAt:desc');
    setTimeout(() => fetchInventory(), 0);
  };

  const confirmDelete = (item) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/inventory/${itemToDelete._id}`, {
        headers: { 'x-auth-token': token }
      });
      setShowDeleteModal(false);
      setItemToDelete(null);
      fetchInventory();
    } catch (err) {
      console.error('Error deleting item:', err);
      setError('Failed to delete item');
      setShowDeleteModal(false);
    }
  };

  return (
    <>
      <h1 className="mb-4">Inventory Management</h1>
      
      <Card className="mb-4">
        <Card.Body>
          <Form onSubmit={handleSearch}>
            <Row className="align-items-end">
              <Col xs={12} md={3} className="mb-3 mb-md-0">
                <Form.Group>
                  <Form.Label>Search</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Search items..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </Form.Group>
              </Col>
              
              <Col xs={12} md={2} className="mb-3 mb-md-0">
                <Form.Group>
                  <Form.Label>Category</Form.Label>
                  <Form.Select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="">All Categories</option>
                    {categories.map((cat, index) => (
                      <option key={index} value={cat}>{cat}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col xs={6} md={2} className="mb-3 mb-md-0">
                <Form.Group>
                  <Form.Label>Min Price</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                  />
                </Form.Group>
              </Col>
              
              <Col xs={6} md={2} className="mb-3 mb-md-0">
                <Form.Group>
                  <Form.Label>Max Price</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                  />
                </Form.Group>
              </Col>
              
              <Col xs={8} md={2} className="mb-3 mb-md-0">
                <Form.Group>
                  <Form.Label>Sort By</Form.Label>
                  <Form.Select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                  >
                    <option value="createdAt:desc">Newest First</option>
                    <option value="createdAt:asc">Oldest First</option>
                    <option value="name:asc">Name (A-Z)</option>
                    <option value="name:desc">Name (Z-A)</option>
                    <option value="price:asc">Price (Low-High)</option>
                    <option value="price:desc">Price (High-Low)</option>
                    <option value="quantity:asc">Quantity (Low-High)</option>
                    <option value="quantity:desc">Quantity (High-Low)</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col xs={4} md={1} className="d-flex justify-content-end">
                <Button variant="primary" type="submit" className="w-100">
                  Filter
                </Button>
              </Col>
            </Row>
            
            <div className="d-flex justify-content-end mt-3">
              <Button variant="secondary" size="sm" onClick={resetFilters}>
                Reset Filters
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
      
      {error && <div className="alert alert-danger">{error}</div>}
      
      <div className="d-flex justify-content-end mb-3">
        <Link to="/add" className="btn btn-success">
          <i className="bi bi-plus-circle me-1"></i> Add New Item
        </Link>
      </div>
      
      {loading ? (
        <div className="text-center my-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : inventory.length === 0 ? (
        <div className="text-center my-5">
          <h3>No inventory items found</h3>
          <p>Add your first item to get started!</p>
          <Link to="/add" className="btn btn-primary">
            Add Item
          </Link>
        </div>
      ) : (
        <div className="table-responsive">
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Tags</th>
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map(item => (
                <tr key={item._id}>
                  <td>{item.name}</td>
                  <td>{item.category}</td>
                  <td>${item.price.toFixed(2)}</td>
                  <td>
                    {item.quantity <= 0 ? (
                      <Badge bg="danger">Out of Stock</Badge>
                    ) : item.quantity < 10 ? (
                      <Badge bg="warning" text="dark">Low Stock ({item.quantity})</Badge>
                    ) : (
                      item.quantity
                    )}
                  </td>
                  <td>
                    {item.tags && item.tags.map((tag, index) => (
                      <Badge key={index} bg="info" className="me-1">{tag}</Badge>
                    ))}
                  </td>
                  <td>{new Date(item.updatedAt).toLocaleDateString()}</td>
                  <td>
                    <div className="d-flex gap-2">
                      <Link to={`/edit/${item._id}`} className="btn btn-sm btn-primary">
                        Edit
                      </Link>
                      <Button 
                        variant="danger" 
                        size="sm" 
                        onClick={() => confirmDelete(item)}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete "{itemToDelete?.name}"? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default InventoryList;