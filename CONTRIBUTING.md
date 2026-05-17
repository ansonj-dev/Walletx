# Contributing to WalletX

Thank you for your interest in contributing to WalletX! This document provides guidelines and instructions for contributing to the project.

## Table of Contents
- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Adding New Features](#adding-new-features)
- [Bug Reports](#bug-reports)
- [Feature Requests](#feature-requests)

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors, regardless of:
- Experience level
- Gender identity and expression
- Sexual orientation
- Disability
- Personal appearance
- Body size
- Race
- Ethnicity
- Age
- Religion
- Nationality

### Our Standards

**Positive behaviors include:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Unacceptable behaviors include:**
- Trolling, insulting/derogatory comments, and personal attacks
- Public or private harassment
- Publishing others' private information without permission
- Other conduct which could reasonably be considered inappropriate

### Enforcement

Instances of abusive, harassing, or otherwise unacceptable behavior may be reported by contacting the project team. All complaints will be reviewed and investigated promptly and fairly.

## Getting Started

### Prerequisites

Before contributing, ensure you have:
- Node.js 18+ installed
- MongoDB 6+ installed
- Git installed
- A GitHub account
- Basic knowledge of JavaScript, Node.js, and MongoDB

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
```bash
git clone https://github.com/YOUR_USERNAME/walletx.git
cd walletx
```

3. Add upstream remote:
```bash
git remote add upstream https://github.com/original/walletx.git
```

4. Create a new branch:
```bash
git checkout -b feature/your-feature-name
```

## Development Setup

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

### Extension Setup

```bash
cd extension
# Load unpacked extension in Chrome
# chrome://extensions/ → Developer mode → Load unpacked
```

### SDK Setup

```bash
cd sdk
npm install
npm test
```

### Running Tests

```bash
# Backend tests
cd backend
npm test

# SDK tests
cd sdk
npm test

# Run with coverage
npm run test:coverage
```

## How to Contribute

### Types of Contributions

We welcome various types of contributions:

1. **Bug Fixes** - Fix issues in existing code
2. **New Features** - Add new functionality
3. **Documentation** - Improve or add documentation
4. **Tests** - Add or improve test coverage
5. **Performance** - Optimize existing code
6. **Refactoring** - Improve code quality

### Contribution Workflow

1. **Find or Create an Issue**
   - Check existing issues
   - Create a new issue if needed
   - Discuss your approach before starting

2. **Create a Branch**
   ```bash
   git checkout -b type/description
   # Examples:
   # feature/add-crypto-payment
   # bugfix/credit-deduction-race
   # docs/improve-readme
   ```

3. **Make Changes**
   - Write clean, documented code
   - Follow coding standards
   - Add tests for new features
   - Update documentation

4. **Commit Changes**
   ```bash
   git add .
   git commit -m "type: description"
   # Examples:
   # feat: add cryptocurrency payment support
   # fix: resolve race condition in credit deduction
   # docs: update API documentation
   ```

5. **Push and Create PR**
   ```bash
   git push origin your-branch-name
   # Create Pull Request on GitHub
   ```

## Coding Standards

### JavaScript Style Guide

We follow the [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript) with some modifications.

#### General Rules

```javascript
// Use const for variables that won't be reassigned
const API_URL = 'https://api.walletx.dev';

// Use let for variables that will be reassigned
let balance = 0;

// Use descriptive variable names
const userBalance = 10.50; // Good
const ub = 10.50; // Bad

// Use camelCase for variables and functions
const getUserBalance = () => {};

// Use PascalCase for classes
class CreditManager {}

// Use UPPER_SNAKE_CASE for constants
const MAX_CREDIT_AMOUNT = 1000;
```

#### Functions

```javascript
// Use arrow functions for callbacks
array.map(item => item.value);

// Use async/await instead of promises
async function fetchBalance() {
  try {
    const response = await api.get('/balance');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch balance:', error);
    throw error;
  }
}

// Add JSDoc comments for public functions
/**
 * Deduct credits from user account
 * @param {string} userId - User ID
 * @param {number} amount - Amount to deduct
 * @param {Object} metadata - Transaction metadata
 * @returns {Promise<number>} Remaining balance
 */
async function deductCredits(userId, amount, metadata) {
  // Implementation
}
```

#### Error Handling

```javascript
// Always handle errors
try {
  await riskyOperation();
} catch (error) {
  logger.error('Operation failed:', error);
  throw new AppError('Operation failed', 500);
}

// Use custom error classes
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}
```

#### Async Operations

```javascript
// Use async/await
async function processPayment(orderId) {
  const order = await Order.findById(orderId);
  const payment = await gateway.charge(order);
  await order.updateStatus('paid');
  return payment;
}

// Handle multiple async operations
const [user, transactions] = await Promise.all([
  User.findById(userId),
  Transaction.find({ userId })
]);
```

### Database Conventions

```javascript
// Use descriptive schema names
const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  credits: {
    type: Number,
    default: 0,
    min: 0
  }
});

// Add indexes for frequently queried fields
UserSchema.index({ email: 1 });
UserSchema.index({ createdAt: 1 });

// Use virtuals for computed properties
UserSchema.virtual('hasCredits').get(function() {
  return this.credits > 0;
});
```

### API Design

```javascript
// RESTful endpoint naming
GET    /api/users/:id          // Get user
POST   /api/users              // Create user
PUT    /api/users/:id          // Update user
DELETE /api/users/:id          // Delete user

// Use plural nouns
GET /api/transactions          // Good
GET /api/transaction           // Bad

// Use nested routes for relationships
GET /api/users/:id/transactions

// Return consistent response format
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}

// Error response format
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_CREDITS",
    "message": "Not enough credits",
    "details": { ... }
  }
}
```

## Testing Guidelines

### Test Structure

```javascript
describe('CreditService', () => {
  describe('deductCredits', () => {
    it('should deduct credits successfully', async () => {
      // Arrange
      const userId = 'test-user-id';
      const amount = 10;
      
      // Act
      const result = await creditService.deductCredits(userId, amount);
      
      // Assert
      expect(result).toBeLessThan(initialBalance);
    });
    
    it('should throw error for insufficient credits', async () => {
      // Arrange
      const userId = 'test-user-id';
      const amount = 1000000;
      
      // Act & Assert
      await expect(
        creditService.deductCredits(userId, amount)
      ).rejects.toThrow('Insufficient credits');
    });
  });
});
```

### Test Coverage

- Aim for 80%+ code coverage
- Test happy paths and edge cases
- Test error conditions
- Mock external dependencies

```javascript
// Mock external API
jest.mock('../services/paymentGateway', () => ({
  charge: jest.fn().mockResolvedValue({ id: 'payment_123' })
}));

// Test with mock
it('should process payment', async () => {
  const result = await paymentService.process(order);
  expect(paymentGateway.charge).toHaveBeenCalledWith(order);
  expect(result.id).toBe('payment_123');
});
```

### Integration Tests

```javascript
// Test complete flow
describe('Payment Flow', () => {
  it('should complete payment and credit account', async () => {
    // Create order
    const order = await request(app)
      .post('/api/payments/create-order')
      .send({ amount: 10 });
    
    // Simulate webhook
    await request(app)
      .post('/api/payments/webhook/stripe')
      .send({ orderId: order.body.orderId });
    
    // Verify balance
    const balance = await request(app)
      .get('/api/credits/balance')
      .expect(200);
    
    expect(balance.body.balance).toBe(10);
  });
});
```

## Pull Request Process

### Before Submitting

1. **Update Documentation**
   - Update README if needed
   - Add JSDoc comments
   - Update API documentation

2. **Run Tests**
   ```bash
   npm test
   npm run test:coverage
   ```

3. **Check Code Style**
   ```bash
   npm run lint
   npm run format
   ```

4. **Update CHANGELOG**
   - Add entry under "Unreleased"
   - Follow format: `- [Type] Description (#PR)`

### PR Title Format

```
type(scope): description

Examples:
feat(payments): add cryptocurrency support
fix(credits): resolve race condition in deduction
docs(readme): update installation instructions
test(api): add integration tests for auth
refactor(services): improve error handling
```

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests pass locally

## Related Issues
Closes #123
```

### Review Process

1. **Automated Checks**
   - Tests must pass
   - Code coverage maintained
   - Linting passes

2. **Code Review**
   - At least one approval required
   - Address all comments
   - Make requested changes

3. **Merge**
   - Squash and merge preferred
   - Delete branch after merge

## Adding New Features

### Adding a New IDE Integration

1. **Create Integration Example**
   ```javascript
   // sdk/examples/new-ide-integration.js
   import WalletX from '@walletx/sdk';
   
   class NewIDEIntegration {
     constructor() {
       this.client = new WalletX({
         apiKey: process.env.WALLETX_API_KEY
       });
     }
     
     async handleAIRequest(request) {
       return await this.client.ai.chat({
         provider: 'openai',
         model: 'gpt-4',
         messages: request.messages
       });
     }
   }
   ```

2. **Add Documentation**
   - Update SDK README
   - Add integration guide
   - Include code examples

3. **Add Tests**
   ```javascript
   describe('NewIDEIntegration', () => {
     it('should handle AI requests', async () => {
       // Test implementation
     });
   });
   ```

### Adding a New AI Provider

1. **Add Provider Configuration**
   ```javascript
   // backend/config/models-pricing.js
   newProvider: {
     'model-name': {
       inputCost: 0.001,
       outputCost: 0.002
     }
   }
   ```

2. **Implement Provider Adapter**
   ```javascript
   // backend/services/providers/newProvider.js
   class NewProviderAdapter {
     async chat(request) {
       // Implementation
     }
   }
   ```

3. **Update AI Provider Service**
   ```javascript
   // backend/services/aiProviderService.js
   const providers = {
     openai: new OpenAIAdapter(),
     anthropic: new AnthropicAdapter(),
     newProvider: new NewProviderAdapter()
   };
   ```

4. **Add Tests**
   ```javascript
   describe('NewProviderAdapter', () => {
     it('should make API calls correctly', async () => {
       // Test implementation
     });
   });
   ```

### Adding a New Payment Method

1. **Add Payment Gateway Integration**
   ```javascript
   // backend/services/gateways/newGateway.js
   class NewGatewayService {
     async createOrder(amount, currency) {
       // Implementation
     }
     
     async verifyWebhook(signature, payload) {
       // Implementation
     }
   }
   ```

2. **Add Webhook Handler**
   ```javascript
   // backend/routes/payments.js
   router.post('/webhook/new-gateway', async (req, res) => {
     // Handle webhook
   });
   ```

3. **Update Frontend**
   ```javascript
   // extension/popup.js
   function handleNewGatewayPayment() {
     // Implementation
   }
   ```

## Bug Reports

### Before Reporting

1. Check existing issues
2. Verify it's reproducible
3. Test on latest version
4. Gather relevant information

### Bug Report Template

```markdown
**Describe the Bug**
Clear description of the bug

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What should happen

**Actual Behavior**
What actually happens

**Screenshots**
If applicable

**Environment**
- OS: [e.g., Windows 11]
- Browser: [e.g., Chrome 120]
- Extension Version: [e.g., 1.0.0]
- Node.js Version: [e.g., 18.0.0]

**Additional Context**
Any other relevant information

**Logs**
```
Paste relevant logs here
```
```

## Feature Requests

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
Clear description of the problem

**Describe the solution you'd like**
Clear description of desired solution

**Describe alternatives you've considered**
Alternative solutions or features

**Additional context**
Any other context, screenshots, or examples

**Would you like to implement this feature?**
- [ ] Yes, I'd like to work on this
- [ ] No, just suggesting
```

## Community

### Communication Channels

- **GitHub Issues:** Bug reports and feature requests
- **GitHub Discussions:** General questions and discussions
- **Discord:** Real-time chat (coming soon)
- **Email:** support@walletx.dev

### Getting Help

If you need help:
1. Check documentation
2. Search existing issues
3. Ask in GitHub Discussions
4. Contact maintainers

## Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Credited in documentation

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to WalletX!**

We appreciate your time and effort in making WalletX better for everyone.

**Questions?** Open an issue or reach out to the maintainers.

**Last Updated:** May 17, 2026  
**Version:** 1.0.0