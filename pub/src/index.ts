#!/usr/bin/env node

import { simpleParser, ParsedMail } from 'mailparser';
import { serializeJSONValue } from './serializer.js';
import { normalizeMailparserOutput } from './native/normalize.js';
import * as transform from './transformations/normalized_smtp_mail/json.js';



async function parseEmailFromStdin(): Promise<void> {
    try {
        // Read from stdin
        const stdinData: Buffer[] = [];

        for await (const chunk of process.stdin) {
            stdinData.push(chunk);
        }

        const emailBuffer = Buffer.concat(stdinData);

        if (emailBuffer.length === 0) {
            console.error('No data received from stdin');
            process.exit(1);
        }

        // Parse the email
        const parsed: ParsedMail = await simpleParser(emailBuffer);

        // Normalize the mailparser output to consistent format
        const normalized = normalizeMailparserOutput(parsed);

        // Convert normalized mail to JSON value format
        const jsonValue = transform.Mail(normalized);

        // Serialize to JSON string
        const jsonString = serializeJSONValue(jsonValue);

        // Output as JSON to stdout
        console.log(jsonString);

    } catch (error) {
        console.error('Error parsing email:', error);
        process.exit(1);
    }
}

// Handle process termination gracefully
process.on('SIGINT', () => {
    process.exit(0);
});

process.on('SIGTERM', () => {
    process.exit(0);
});

// Main execution
if (require.main === module) {
    parseEmailFromStdin().catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}