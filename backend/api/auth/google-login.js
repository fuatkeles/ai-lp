const { handleGoogleLogin } = require('../../services/authService');
const Joi = require('joi');

// Validation schema for Google login request
const googleLoginSchema = Joi.object({
  idToken: Joi.string().required().messages({
    'string.empty': 'ID token is required',
    'any.required': 'ID token is required'
  })
});

// Google OAuth login endpoint
const googleLogin = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = googleLoginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details[0].message
        }
      });
    }
    
    const { idToken } = value;
    
    // Process Google login
    const loginResult = await handleGoogleLogin(idToken);
    
    if (!loginResult.success) {
      const statusCode = loginResult.error.code === 'INVALID_TOKEN' ? 401 : 500;
      return res.status(statusCode).json({
        success: false,
        error: loginResult.error
      });
    }
    
    // Set secure HTTP-only cookie for JWT token (optional)
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    };
    
    res.cookie('auth_token', loginResult.token, cookieOptions);
    
    // Return success response
    return res.status(200).json({
      success: true,
      data: {
        user: {
          uid: loginResult.user.uid,
          email: loginResult.user.email,
          displayName: loginResult.user.displayName,
          photoURL: loginResult.user.photoURL,
          role: loginResult.user.role,
          subscription: loginResult.user.subscription
        },
        token: loginResult.token,
        isNewUser: loginResult.isNewUser
      },
      message: loginResult.isNewUser ? 'Account created successfully' : 'Login successful'
    });
    
  } catch (error) {
    console.error('Google login endpoint error:', error.message);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to process login request'
      }
    });
  }
};

module.exports = googleLogin;