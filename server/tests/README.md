# Doctor Photo Upload Tests

This directory contains automated tests for the doctor profile photo upload functionality.

## Test Files

### 1. `routes/doctor-profile-upload.test.ts`
Complete endpoint tests for the doctor photo upload API, including:
- Base64 image upload (iOS style)
- Multipart form upload (web style)
- Authentication validation
- Error handling scenarios
- Image removal functionality
- Concurrent upload handling

### 2. `routes/doctor-upload-integration.test.ts`
Integration tests focusing on the complete upload flow:
- S3 upload integration
- Database consistency between `doctors` and `users` tables
- Error recovery scenarios
- LGPD compliance

### 3. `test-doctor-upload.js`
Standalone test script for manual testing against a running server:
- No test framework required
- Tests real API endpoints
- Provides colored output for easy reading
- Can be run with custom credentials

## Running Tests

### Unit Tests (Jest)

```bash
# Run all doctor upload tests
npm test -- server/tests/routes/

# Run specific test file
npm test -- server/tests/routes/doctor-profile-upload.test.ts

# Run with coverage
npm test -- --coverage server/tests/routes/
```

### Manual API Tests

```bash
# Using default test credentials
node server/tests/test-doctor-upload.js

# Using custom credentials
TEST_DOCTOR_EMAIL=doctor@example.com TEST_DOCTOR_PASSWORD=password node server/tests/test-doctor-upload.js

# Against production (be careful!)
API_URL=https://cnvidas.onrender.com node server/tests/test-doctor-upload.js
```

## Test Coverage

The tests cover:

1. **Authentication**
   - JWT token validation
   - Cookie-based authentication
   - Role-based access (doctor only)

2. **Upload Methods**
   - Base64 image upload (iOS/mobile)
   - Multipart form upload (web)
   - File type validation
   - Size limit enforcement

3. **S3 Integration**
   - Secure upload to AWS S3
   - Signed URL generation
   - File deletion
   - Error handling

4. **Database Operations**
   - Update both `doctors` and `users` tables
   - Maintain data consistency
   - Handle concurrent updates
   - Soft delete for LGPD compliance

5. **Error Scenarios**
   - Missing authentication
   - Invalid image data
   - S3 service failures
   - Database connection errors
   - Missing doctor profile

## Adding New Tests

When adding new tests:

1. Follow the existing test structure
2. Mock external dependencies (S3, database)
3. Test both success and failure scenarios
4. Ensure cleanup after tests
5. Use descriptive test names

## Environment Variables

For manual testing, you can set:
- `API_URL`: The API server URL (default: http://localhost:3001)
- `TEST_DOCTOR_EMAIL`: Test doctor account email
- `TEST_DOCTOR_PASSWORD`: Test doctor account password

## Troubleshooting

If tests are hanging:
```bash
npm test -- --detectOpenHandles
```

If you need to force exit:
```bash
npm test -- --forceExit
```

## CI/CD Integration

These tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run Tests
  run: |
    npm install
    npm test -- server/tests/routes/ --ci --coverage
```