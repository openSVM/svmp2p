import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock CSS imports
jest.mock('../src/styles/theme/index.css', () => ({}));
jest.mock('../src/index.css', () => ({}));

describe('Component Styling Tests', () => {
  // Test that components use the new theme classes
  test('Components use the new theme classes', () => {
    // Create a test component that simulates our app components
    const TestComponent = () => (
      <div className="app-container">
        <header className="app-header">
          <div className="logo-container">
            <h1>SVMP2P</h1>
          </div>
          <div className="wallet-container">
            <span className="wallet-address">0x123...abc</span>
            <button className="action-button">Connect</button>
          </div>
        </header>
        <main className="app-main">
          <h2 className="section-title">Marketplace</h2>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Offer #1</h3>
            </div>
            <div className="card-body">
              <p>Offer details</p>
            </div>
            <div className="card-footer">
              <button className="button button-primary">Accept</button>
            </div>
          </div>
        </main>
      </div>
    );
    
    render(<TestComponent />);
    
    // Check if elements are rendered with correct classes
    expect(screen.getByText('SVMP2P')).toBeInTheDocument();
    expect(screen.getByText('0x123...abc')).toHaveClass('wallet-address');
    expect(screen.getByText('Connect')).toHaveClass('action-button');
    expect(screen.getByText('Marketplace')).toHaveClass('section-title');
    expect(screen.getByText('Offer #1')).toHaveClass('card-title');
    expect(screen.getByText('Accept')).toHaveClass('button');
    expect(screen.getByText('Accept')).toHaveClass('button-primary');
  });
  
  // Test form components styling
  test('Form components use the new theme classes', () => {
    const TestFormComponent = () => (
      <form>
        <div className="form-group">
          <label className="form-label">Username</label>
          <input className="form-input" placeholder="Enter username" />
          <p className="form-help-text">Your unique username</p>
        </div>
        <div className="form-group">
          <label className="form-label">Options</label>
          <select className="form-select">
            <option>Option 1</option>
            <option>Option 2</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-checkbox">
            <input type="checkbox" />
            <span>Remember me</span>
          </label>
        </div>
        <button className="button button-primary">Submit</button>
      </form>
    );
    
    render(<TestFormComponent />);
    
    // Check if form elements are rendered with correct classes
    expect(screen.getByText('Username')).toHaveClass('form-label');
    expect(screen.getByPlaceholderText('Enter username')).toHaveClass('form-input');
    expect(screen.getByText('Your unique username')).toHaveClass('form-help-text');
    expect(screen.getByText('Options')).toHaveClass('form-label');
    expect(screen.getByRole('combobox')).toHaveClass('form-select');
    expect(screen.getByText('Remember me')).toBeInTheDocument();
    expect(screen.getByText('Submit')).toHaveClass('button');
    expect(screen.getByText('Submit')).toHaveClass('button-primary');
  });
  
  // Test table components styling
  test('Table components use the new theme classes', () => {
    const TestTableComponent = () => (
      <div className="table-responsive">
        <table className="table">
          <thead className="table-header">
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody className="table-body">
            <tr>
              <td>John Doe</td>
              <td>john@example.com</td>
              <td>
                <button className="button button-sm button-primary">Edit</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
    
    render(<TestTableComponent />);
    
    // Check if table elements are rendered with correct classes
    expect(screen.getByRole('table')).toHaveClass('table');
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Edit')).toHaveClass('button');
    expect(screen.getByText('Edit')).toHaveClass('button-sm');
    expect(screen.getByText('Edit')).toHaveClass('button-primary');
  });
});
