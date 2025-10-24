# smtp-to-astn

A command-line tool that converts SMTP email messages from stdin to ASTN (Abstract Syntax Tree Notation) format on stdout.

## Installation

```bash
npm install -g smtp-to-astn
```

## Usage

### Command Line

```bash
# Read email from file
cat email.eml | smtp-to-astn

# Read email from stdin
smtp-to-astn < message.eml

# Pipe from another command
your-email-source | smtp-to-astn
```

### Programmatic Usage

```bash
# Install locally
npm install smtp-to-astn

# Use in your project
cd node_modules/smtp-to-astn/pub && node dist/index.js < email.eml
```

## What is ASTN?

ASTN is to JSON what TypeScript is to Javascript

ASTN (Abstract Syntax Tree Notation) is a human-readable data serialization format developed for representing structured data in a tree-like format. Unlike JSON, ASTN supports more complex data structures and provides better readability for nested data.

Key features of ASTN:
- **Human-readable**: Clean, indented syntax that's easy to read and understand
- **Type-safe**: Strong typing with explicit type annotations
- **Hierarchical**: Natural representation of nested data structures
- **Extensible**: Support for custom types and complex data patterns

For more information about ASTN, visit the [ASTN repository](https://github.com/corno/astn).

ASTN is particularly well-suited for representing email data because emails have typed complex, nested structures (headers, multipart content, attachments) that benefit from ASTN's hierarchical format.

## Input Format

The tool accepts standard RFC 5322 compliant email messages, including:

- Plain text emails
- HTML emails
- Multipart messages
- Emails with attachments
- Complex MIME structures
- Unicode content
- Custom headers

## Output Format

The output is in ASTN format, containing structured information about:

- **Headers**: All email headers in a structured format
- **Addresses**: From, To, CC, BCC fields with parsed address objects
- **Content**: Text and HTML content
- **Attachments**: Base64-encoded attachment data with metadata
- **Metadata**: Message ID, date, references, etc.

## Example

### Input (email.eml):
```
From: sender@example.com
To: recipient@example.com
Subject: Test Email
Date: Thu, 24 Oct 2025 10:30:00 +0000
Content-Type: text/plain

Hello, this is a test email.
```

### Output (ASTN format):
```
Mail{
  headers: Dictionary{
    "from": Array["address", Address_Object{...}]
    "to": Array["address_list", Array[Address_Object{...}]]
    "subject": Array["unstructured", "Test Email"]
    "date": Array["date", "2025-10-24T10:30:00.000Z"]
    "content-type": Array["content_type", Object{...}]
  }
  subject: "Test Email"
  from: Address_Object{
    value: Array[Address{
      address: "sender@example.com"
      name: ""
    }]
    html: "<span>sender@example.com</span>"
    text: "sender@example.com"
  }
  to: Array[Address_Object{...}]
  # ... more fields
}
```

## Features

- **RFC 5322 Compliant**: Properly handles all standard email formats
- **Comprehensive Parsing**: Extracts headers, addresses, content, and attachments
- **Unicode Support**: Handles international characters and encoding
- **Attachment Processing**: Base64 encodes attachments with metadata
- **Type Safety**: Built with TypeScript for reliable parsing
- **Extensible**: Structured output format for further processing

## Testing

The project includes comprehensive regression tests covering various email formats:

```bash
# Run all tests
npm test

# Generate expected outputs (for development)
npm run generate-expected
```

## Development

```bash
# Clone the repository
git clone https://github.com/corno/smtp_to_astn.git
cd smtp_to_astn

# Install dependencies
npm run install-deps

# Build the project
npm run build

# Run tests
npm test

# Test with sample email
npm run test-complex
```

## Dependencies

- **mailparser**: RFC 5322 compliant email parser
- **astn**: ASTN format generation and serialization
- **pareto-fountain-pen**: Text formatting and serialization

## License

Licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE) for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite: `npm test`
6. Submit a pull request

## Changelog

### 1.0.0
- Initial release
- RFC 5322 compliant email parsing
- ASTN format output
- Comprehensive test suite
- Command-line interface
- Support for attachments, HTML content, and complex MIME structures