# Project Structure

The SMTP to JSON converter is organized with a clean directory structure:

```
smtp_to_json/
├── data/                     # Test data and examples
│   └── test/                 # Test email files
│       ├── test-email.eml           # Simple test email
│       └── test-email-complex.eml   # Complex email with attachments
├── pub/                      # Main application directory
│   ├── package.json          # Node.js dependencies and scripts
│   ├── package-lock.json     # Dependency lock file
│   ├── node_modules/         # Dependencies
│   ├── tsconfig.json         # TypeScript configuration
│   ├── dist/                 # Compiled JavaScript output
│   └── src/                  # TypeScript source code
│       ├── types.ts          # Type definitions (SMTPMessage, Attachment, etc.)
│       ├── json-value.ts     # JSON_Value type definition
│       ├── converter.ts      # Convert namespace with type-specific functions
│       ├── serializer.ts     # JSON_Value → string serialization
│       └── index.ts          # Main application logic and CLI interface
├── smtp-to-json.sh           # Convenience shell script
├── .gitignore               # Git ignore patterns
└── *.md                     # Documentation files
```

## Directory Purposes

### `data/test/`
- Contains sample email files for testing
- `test-email.eml`: Simple multipart email
- `test-email-complex.eml`: Complex email with attachments, CC, BCC

### `pub/`
- Main application code and dependencies
- Isolated from root directory for cleaner organization
- Contains all build artifacts and runtime dependencies

### `pub/src/`
- TypeScript source code organized by concern:
  - `types.ts`: Centralized type definitions
  - `converter.ts`: Type-specific conversion logic  
  - `serializer.ts`: JSON string generation
  - `json-value.ts`: Intermediate format types
  - `index.ts`: CLI application and email parsing

### Root Directory
- Project-level files and utilities
- Shell script for convenience
- Documentation and configuration

## Usage Examples

```bash
# Build the project
cd pub && npm install && npm run build

# Test with sample emails
npm test                           # Simple email
npm run test-complex              # Complex email

# Use shell script from root
./smtp-to-json.sh data/test/test-email.eml

# Direct usage
cat data/test/test-email-complex.eml | node pub/dist/index.js

# Process any email file
cat my-email.eml | node pub/dist/index.js > output.json
```

## Benefits of This Structure

✅ **Clear Separation**: Test data separate from application code  
✅ **Organized Dependencies**: All npm packages contained in `pub/`  
✅ **Modular Source**: Related functionality grouped together  
✅ **Easy Testing**: Sample files in predictable location  
✅ **Clean Root**: Minimal files at project root level  
✅ **Scalable**: Easy to add more test data or source modules  

This structure makes the project easy to navigate, test, and maintain while keeping concerns properly separated.