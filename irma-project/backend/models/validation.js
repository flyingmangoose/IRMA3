const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define validation middleware
const validateEmail = function(email) {
  const re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return re.test(email);
};

// Define validation error messages
const validationMessages = {
  required: '{PATH} is required',
  min: '{PATH} must be at least {VALUE}',
  max: '{PATH} cannot exceed {VALUE}',
  email: '{VALUE} is not a valid email address'
};

// Apply validation to all models
const applyValidation = (schema) => {
  // Add validation to all string fields
  Object.keys(schema.paths).forEach(path => {
    const schemaType = schema.paths[path];
    
    if (schemaType.instance === 'String' && path !== '_id' && path !== '__v') {
      schemaType.validate({
        validator: function(v) {
          return v && v.length > 0;
        },
        message: validationMessages.required
      });
      
      // Add email validation for email fields
      if (path.toLowerCase().includes('email')) {
        schemaType.validate({
          validator: validateEmail,
          message: validationMessages.email
        });
      }
    }
    
    // Add validation for number fields
    if (schemaType.instance === 'Number' && schemaType.options.min !== undefined) {
      schemaType.validate({
        validator: function(v) {
          return v >= schemaType.options.min;
        },
        message: validationMessages.min
      });
    }
    
    if (schemaType.instance === 'Number' && schemaType.options.max !== undefined) {
      schemaType.validate({
        validator: function(v) {
          return v <= schemaType.options.max;
        },
        message: validationMessages.max
      });
    }
  });
  
  return schema;
};

// Export the validation utility
module.exports = {
  applyValidation,
  validateEmail
};
