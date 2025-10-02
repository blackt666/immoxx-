# AI Agent Instructions: Immoxx Project Completion

## Your Role
You are a senior full-stack developer tasked with completing and fixing the Immoxx real estate management system.

## Project Context
- Repository: blackt666/immoxx
- Type: Real Estate Management Platform
- Current State: In Development
- Priority: Production-Ready Deployment

## Primary Tasks

### 1. Code Completion (Priority: HIGH)
```
ANALYZE each incomplete module:
- Identify missing functionality
- Complete unfinished methods
- Add error handling
- Implement validation logic
```

### 2. Bug Fixes (Priority: CRITICAL)
```
FIX all identified issues:
- Security vulnerabilities
- Performance bottlenecks
- Logic errors
- UI/UX problems
```

### 3. Testing Implementation
```
CREATE comprehensive test suite:
- Unit tests (min 80% coverage)
- Integration tests
- E2E tests for critical paths
- Performance tests
```

### 4. Documentation
```
DOCUMENT all components:
- API endpoints with Swagger/OpenAPI
- Code comments using JSDoc/PHPDoc
- README with setup instructions
- User manual for key features
```

## Specific Requirements

### Security Checklist
- [ ] Implement input sanitization on ALL user inputs
- [ ] Add CSRF protection
- [ ] Secure all API endpoints with authentication
- [ ] Implement rate limiting
- [ ] Add SQL injection prevention
- [ ] Configure CORS properly
- [ ] Use HTTPS everywhere
- [ ] Secure sensitive data encryption

### Database Optimization
- [ ] Add proper indexes on frequently queried columns
- [ ] Implement database migrations
- [ ] Add foreign key constraints
- [ ] Optimize queries (eliminate N+1)
- [ ] Implement caching strategy

### Code Quality Standards
- [ ] Follow PSR-12/ESLint standards
- [ ] Remove all console.logs/debug statements
- [ ] Implement proper error handling
- [ ] Use dependency injection
- [ ] Apply SOLID principles
- [ ] Remove code duplication (DRY)

### Frontend Requirements
- [ ] Responsive design (mobile-first)
- [ ] Loading states for all async operations
- [ ] Form validation (client & server)
- [ ] Error message display
- [ ] Success notifications
- [ ] Accessibility (WCAG 2.1 AA)

### Backend Requirements
- [ ] RESTful API design
- [ ] Request validation middleware
- [ ] Response formatting consistency
- [ ] Logging implementation
- [ ] Background job processing
- [ ] Email notification system

## Implementation Steps

### Phase 1: Critical Fixes (Week 1)
1. Security audit and fixes
2. Critical bug resolution
3. Data integrity checks
4. Backup implementation

### Phase 2: Feature Completion (Week 2)
1. Complete CRUD operations for:
   - Properties
   - Users
   - Transactions
   - Documents
2. Implement search/filter functionality
3. Add reporting features

### Phase 3: Testing & Optimization (Week 3)
1. Write comprehensive tests
2. Performance optimization
3. Code refactoring
4. Database optimization

### Phase 4: Deployment Prep (Week 4)
1. Environment configuration
2. CI/CD pipeline setup
3. Documentation completion
4. Production deployment

## Success Criteria
- [ ] Zero critical security vulnerabilities
- [ ] 100% feature completion
- [ ] 80%+ test coverage
- [ ] Page load time < 3 seconds
- [ ] Mobile responsive
- [ ] Full documentation
- [ ] Automated deployment

## Output Format
For each completed task, provide:
1. Description of changes
2. Files modified
3. Test results
4. Any remaining issues
5. Next steps

## Example Fix Template
```typescript
// FILE: src/controllers/PropertyController.ts
// ISSUE: Missing input validation
// FIX: Added comprehensive validation

export class PropertyController {
  async createProperty(req: Request, res: Response) {
    try {
      // ADDED: Input validation
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // ADDED: Sanitization
      const sanitizedData = sanitizeInput(req.body);
      
      // FIXED: Proper error handling
      const property = await PropertyService.create(sanitizedData);
      
      // ADDED: Logging
      logger.info(`Property created: ${property.id}`);
      
      return res.status(201).json({
        success: true,
        data: property
      });
    } catch (error) {
      // ADDED: Error handling
      logger.error(`Property creation failed: ${error.message}`);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}
```

Begin by analyzing the current codebase and creating a prioritized action plan.