export const successResponse = (data, message = 'Success', statusCode = 200) => {
  return Response.json(
    {
      success: true,
      message,
      data
    },
    { status: statusCode }
  );
};

export const errorResponse = (message, statusCode = 400, code = null) => {
  return Response.json(
    {
      success: false,
      error: {
        code: code || 'ERROR',
        message,
      }
    },
    { status: statusCode }
  );
};

export const handleError = (error) => {
  console.error('API Error:', error);

  if (error.name === 'ValidationError') {
    return errorResponse(error.message, 400, 'VALIDATION_ERROR');
  }

  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    return errorResponse(`${field} already exists`, 409, 'DUPLICATE_ERROR');
  }

  if (error.message === 'Authentication failed') {
    return errorResponse('Authentication failed', 401, 'UNAUTHORIZED');
  }

  if (error.message.includes('Forbidden')) {
    return errorResponse(error.message, 403, 'FORBIDDEN');
  }

  return errorResponse(
    error.message || 'Internal server error',
    500,
    'INTERNAL_ERROR'
  );
};