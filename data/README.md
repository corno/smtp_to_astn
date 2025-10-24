# Test Data

This directory contains comprehensive test data for the SMTP to JSON converter, including sample email files and a complete regression testing framework.

## Structure

```
data/
├── README.md           # This file
└── test/               # Test suite directory
    ├── README.md       # Test suite documentation
    ├── rfc-simple-addressing/
    │   ├── source.eml
    │   └── expected.json
    ├── rfc-multiple-addresses/
    │   ├── source.eml
    │   └── expected.json
    └── ... (14 test cases total)
```

## Quick Start

```bash
# Run all regression tests
./test-suite.sh

# Test with a specific email
cat data/test/rfc-simple-addressing/source.eml | node pub/dist/index.js

# Generate expected outputs for new tests
./generate-expected.sh
```

## Test Categories

### RFC 5322 Compliance Tests (7 cases)
Tests based on examples from RFC 5322 specification:
- Simple addressing
- Multiple addresses with special characters
- Group addressing syntax
- Reply messages and threading
- Resent/forwarded messages
- Trace fields and routing
- Comments and whitespace handling

### MIME Support Tests (2 cases)
- Multipart/alternative messages
- File attachments with base64 encoding

### Real-world Scenarios (5 cases)
- Custom X- headers
- Unicode content and encoding
- Complex multipart structures
- Edge cases and malformed headers

## Output Format

All tests validate against a consistent tagged union schema:

```json
{
  "headers": {
    "subject": ["unstructured", "Hello World"],
    "from": ["address", { "value": "sender@example.com", "name": "Sender Name" }],
    "to": ["address_list", [{ "value": "recipient@example.com" }]],
    "content-type": ["content_type", { "value": "text/plain", "params": {} }],
    "date": ["date", "2025-01-24T10:30:00.000Z"],
    "message-id": ["message_id", "<unique@example.com>"],
    "references": ["message_id_list", ["<id1@example.com>"]],
    "x-custom": ["unknown", "custom value"]
  },
  "attachments": [...],
  "text": "Plain text content",
  "html": "<html>HTML content</html>"
}
```

## Development Workflow

1. **Adding Tests**: Create new directory in `test/` with `source.eml`
2. **Generating Expected**: Run `./generate-expected.sh` to create `expected.json`
3. **Validation**: Run `./test-suite.sh` to verify all tests pass
4. **Regression Testing**: Automated validation prevents breaking changes

See `test/README.md` for detailed test suite documentation.