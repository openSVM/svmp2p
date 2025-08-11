import React from 'react';
import PropTypes from 'prop-types';

/**
 * Efficient ASCII-themed form components that reduce vertical space usage
 * by rendering fields in horizontal layouts instead of stacking vertically
 */

// Main form container
export const ASCIIForm = ({ children, onSubmit, className = '', ...props }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) onSubmit(e);
  };

  return (
    <form 
      className={`ascii-form ${className}`}
      onSubmit={handleSubmit}
      {...props}
    >
      {children}
    </form>
  );
};

// Form header/title
export const ASCIIFormHeader = ({ children, className = '' }) => (
  <div className={`ascii-form-header ${className}`}>
    {children}
  </div>
);

// Horizontal form row - fields side by side
export const ASCIIFormRow = ({ children, columns = 'auto', className = '' }) => {
  const getColumnClass = () => {
    if (typeof columns === 'number') {
      return `ascii-form-row-${columns}`;
    }
    return 'ascii-form-row';
  };

  return (
    <div className={`${getColumnClass()} ${className}`}>
      {children}
    </div>
  );
};

// Inline form - all fields in one line
export const ASCIIFormInline = ({ children, className = '' }) => (
  <div className={`ascii-form-inline ${className}`}>
    {children}
  </div>
);

// Individual field container
export const ASCIIField = ({ 
  label, 
  children, 
  error, 
  help, 
  required = false, 
  inline = false,
  className = '' 
}) => {
  const fieldClass = inline ? 'ascii-field-inline' : 'ascii-field';
  const errorClass = error ? 'ascii-field-error' : '';
  
  return (
    <div className={`${fieldClass} ${errorClass} ${className}`}>
      {label && (
        <label>
          {label}
          {required && <span style={{ color: 'var(--ascii-neutral-800)' }}> *</span>}
        </label>
      )}
      {children}
      {error && <div className="ascii-field-error-message">{error}</div>}
      {help && <div className="ascii-field-help">{help}</div>}
    </div>
  );
};

// Input field with ASCII styling
export const ASCIIInput = ({ 
  type = 'text', 
  placeholder, 
  value, 
  onChange, 
  name, 
  id,
  required = false,
  disabled = false,
  size = 'normal',
  className = '',
  ...props 
}) => {
  const sizeClass = size !== 'normal' ? `ascii-field-${size}` : '';
  
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      name={name}
      id={id}
      required={required}
      disabled={disabled}
      className={`${sizeClass} ${className}`}
      {...props}
    />
  );
};

// Select field with ASCII styling
export const ASCIISelect = ({ 
  options = [], 
  value, 
  onChange, 
  name, 
  id,
  placeholder,
  required = false,
  disabled = false,
  size = 'normal',
  className = '',
  ...props 
}) => {
  const sizeClass = size !== 'normal' ? `ascii-field-${size}` : '';
  
  return (
    <select
      value={value}
      onChange={onChange}
      name={name}
      id={id}
      required={required}
      disabled={disabled}
      className={`${sizeClass} ${className}`}
      {...props}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((option, index) => (
        <option key={index} value={option.value || option}>
          {option.label || option}
        </option>
      ))}
    </select>
  );
};

// Textarea with ASCII styling
export const ASCIITextarea = ({ 
  placeholder, 
  value, 
  onChange, 
  name, 
  id,
  rows = 3,
  required = false,
  disabled = false,
  className = '',
  ...props 
}) => {
  return (
    <textarea
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      name={name}
      id={id}
      rows={rows}
      required={required}
      disabled={disabled}
      className={className}
      {...props}
    />
  );
};

// Form section for grouping related fields
export const ASCIIFormSection = ({ title, children, className = '' }) => (
  <div className={`ascii-form-section ${className}`}>
    {title && <div className="ascii-form-section-title">{title}</div>}
    {children}
  </div>
);

// Form actions (buttons)
export const ASCIIFormActions = ({ 
  children, 
  alignment = 'right', 
  className = '' 
}) => {
  const alignmentClass = `ascii-form-actions-${alignment}`;
  
  return (
    <div className={`ascii-form-actions ${alignmentClass} ${className}`}>
      {children}
    </div>
  );
};

// Filter/search bar
export const ASCIIFormFilters = ({ children, className = '' }) => (
  <div className={`ascii-form-filters ${className}`}>
    {children}
  </div>
);

// Form table for displaying data
export const ASCIIFormTable = ({ headers = [], rows = [], className = '' }) => (
  <table className={`ascii-form-table ${className}`}>
    {headers.length > 0 && (
      <thead>
        <tr>
          {headers.map((header, index) => (
            <th key={index}>{header}</th>
          ))}
        </tr>
      </thead>
    )}
    <tbody>
      {rows.map((row, rowIndex) => (
        <tr key={rowIndex}>
          {row.map((cell, cellIndex) => (
            <td key={cellIndex}>{cell}</td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);

// Predefined form layouts for common use cases

// Compact offer creation form layout
export const OfferFormLayout = ({ children }) => (
  <ASCIIForm>
    <ASCIIFormHeader>CREATE SELL OFFER</ASCIIFormHeader>
    <ASCIIFormRow columns={2}>
      {children}
    </ASCIIFormRow>
  </ASCIIForm>
);

// Transaction history filter layout
export const TransactionFiltersLayout = ({ children }) => (
  <ASCIIFormFilters>
    {children}
  </ASCIIFormFilters>
);

// Dispute form layout
export const DisputeFormLayout = ({ children }) => (
  <ASCIIForm>
    <ASCIIFormHeader>SUBMIT EVIDENCE</ASCIIFormHeader>
    {children}
  </ASCIIForm>
);

// Profile settings layout
export const ProfileFormLayout = ({ children }) => (
  <ASCIIForm>
    <ASCIIFormRow columns={2}>
      {children}
    </ASCIIFormRow>
  </ASCIIForm>
);

// PropTypes
ASCIIForm.propTypes = {
  children: PropTypes.node.isRequired,
  onSubmit: PropTypes.func,
  className: PropTypes.string,
};

ASCIIFormHeader.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

ASCIIFormRow.propTypes = {
  children: PropTypes.node.isRequired,
  columns: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  className: PropTypes.string,
};

ASCIIFormInline.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

ASCIIField.propTypes = {
  label: PropTypes.string,
  children: PropTypes.node.isRequired,
  error: PropTypes.string,
  help: PropTypes.string,
  required: PropTypes.bool,
  inline: PropTypes.bool,
  className: PropTypes.string,
};

ASCIIInput.propTypes = {
  type: PropTypes.string,
  placeholder: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  name: PropTypes.string,
  id: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  size: PropTypes.oneOf(['sm', 'normal', 'lg']),
  className: PropTypes.string,
};

ASCIISelect.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        value: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
      }),
    ])
  ),
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  name: PropTypes.string,
  id: PropTypes.string,
  placeholder: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  size: PropTypes.oneOf(['sm', 'normal', 'lg']),
  className: PropTypes.string,
};

ASCIITextarea.propTypes = {
  placeholder: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
  name: PropTypes.string,
  id: PropTypes.string,
  rows: PropTypes.number,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  className: PropTypes.string,
};

ASCIIFormSection.propTypes = {
  title: PropTypes.string,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

ASCIIFormActions.propTypes = {
  children: PropTypes.node.isRequired,
  alignment: PropTypes.oneOf(['left', 'center', 'right', 'spread']),
  className: PropTypes.string,
};

ASCIIFormFilters.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

ASCIIFormTable.propTypes = {
  headers: PropTypes.arrayOf(PropTypes.string),
  rows: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.node)),
  className: PropTypes.string,
};

const ASCIIFormComponents = {
  ASCIIForm,
  ASCIIFormHeader,
  ASCIIFormRow,
  ASCIIFormInline,
  ASCIIField,
  ASCIIInput,
  ASCIISelect,
  ASCIITextarea,
  ASCIIFormSection,
  ASCIIFormActions,
  ASCIIFormFilters,
  ASCIIFormTable,
  OfferFormLayout,
  TransactionFiltersLayout,
  DisputeFormLayout,
  ProfileFormLayout,
};

export default ASCIIFormComponents;