# Test Data

This directory contains sample email files for testing the SMTP to JSON converter.

## Files

### `test/test-email.eml`
A simple email with:
- Basic headers (From, To, Subject, Date, Message-ID)
- Multipart content (plain text and HTML)
- No attachments

### `test/test-email-complex.eml`
A complex email with:
- Multiple recipients (To, CC)
- Named sender ("John Doe" <john@example.com>)
- Thread information (In-Reply-To, References)
- Multipart content with attachment
- PDF attachment (base64 encoded)

## Usage

```bash
# Test with simple email
cat data/test/test-email.eml | node pub/dist/index.js

# Test with complex email
cat data/test/test-email-complex.eml | node pub/dist/index.js

# Using the shell script
./smtp-to-json.sh data/test/test-email.eml

# Using npm scripts (from pub directory)
npm test                # Uses test-email.eml
npm run test-complex    # Uses test-email-complex.eml
```

## Adding More Test Data

To add more test emails:
1. Save email files with `.eml` extension in this directory
2. Use descriptive filenames (e.g., `test-email-with-images.eml`)
3. Add corresponding npm scripts in `pub/package.json` if needed

## Email Format

All files should be in standard RFC 5322 email format (SMTP message format), including:
- Headers section
- Empty line separator
- Message body (can be multipart)