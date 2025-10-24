# SMTP to JSON Test Suite

This directory contains a comprehensive regression test suite for the SMTP to JSON converter.

## Test Structure

Each test case is organized in its own directory:

```
data/test/
├── custom-headers/
│   ├── source.eml      # Input email
│   └── expected.json   # Expected JSON output
├── mime-attachment/
│   ├── source.eml
│   └── expected.json
└── ... (more test cases)
```

## Test Categories

### RFC 5322 Compliance Tests
- `rfc-simple-addressing/` - Basic email with simple addressing
- `rfc-multiple-addresses/` - Multiple recipients with special characters
- `rfc-group-addresses/` - Group addressing syntax
- `rfc-reply-messages/` - Message threads and replies
- `rfc-resent-message/` - Resent/forwarded messages
- `rfc-trace-fields/` - Received headers and trace fields
- `rfc-comments-whitespace/` - Comments and whitespace handling

### MIME Support Tests
- `mime-multipart/` - Multipart/alternative messages
- `mime-attachment/` - File attachments

### Real-world Scenarios
- `custom-headers/` - Custom X- headers and extensions
- `unicode-content/` - Unicode characters and encoding
- `test-email/` - Basic multipart test case
- `test-email-complex/` - Complex email with attachments

## Running Tests

### Regression Testing
```bash
./test-suite.sh
```
Runs all tests against expected outputs to detect regressions.

### Generating Expected Outputs
```bash
./generate-expected.sh
```
Regenerates all `expected.json` files. Use this when:
- Adding new test cases
- Intentionally changing output format
- After fixing bugs that change expected behavior

## Adding New Tests

1. Create a new directory in `data/test/`
2. Add `source.eml` with your test email
3. Run `./generate-expected.sh` to create `expected.json`
4. Run `./test-suite.sh` to verify the test works

## Schema Format

All outputs follow the tagged union schema:

```json
{
  "headers": {
    "subject": ["unstructured", "Hello World"],
    "from": ["address", { ... }],
    "to": ["address_list", [{ ... }]],
    "content-type": ["content_type", { "value": "text/plain", "params": { ... } }],
    "date": ["date", "2025-10-24T10:30:00.000Z"],
    "message-id": ["message_id", "<123@example.com>"],
    "references": ["message_id_list", ["<id1>", "<id2>"]],
    "x-custom": ["unknown", "custom value"]
  },
  "attachments": [...],
  "text": "...",
  "html": "..."
}
```

This structure ensures type safety and makes the output predictable for downstream consumers.