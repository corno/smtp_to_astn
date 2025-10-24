#!/usr/bin/env node

import { simpleParser, ParsedMail, Attachment, AddressObject } from 'mailparser';
import { JSON_Value } from './json-value.js';
import { serializeJSONValue } from './serializer.js';
import { convertSMTPMessage } from './converter.js';
import { SMTPMessage } from './types.js';

// Main build function using functional approach
const buildSMTPJSON = (smtpMessage: SMTPMessage, indentSize: number = 2): string => {
    const indent = ' '.repeat(indentSize);
    const jsonValue = convertSMTPMessage(smtpMessage);
    return serializeJSONValue(jsonValue, indent);
};

// Generic build function for backward compatibility
const buildJSON = (obj: any, indentSize: number = 2): string => {
    const indent = ' '.repeat(indentSize);
    // Import the legacy converter for generic objects
    const { toJSONValue } = require('./converter.js');
    const jsonValue = toJSONValue(obj);
    return serializeJSONValue(jsonValue, indent);
};

class JSONBuilder {
    private indent: string;
    private level: number;

    constructor(indentSize: number = 2) {
        this.indent = ' '.repeat(indentSize);
        this.level = 0;
    }

    private getIndent(): string {
        return this.indent.repeat(this.level);
    }

    private escapeString(str: string): string {
        return str
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t')
            .replace(/[\b]/g, '\\b')
            .replace(/\f/g, '\\f')
            .replace(/[\u0000-\u001f\u007f-\u009f]/g, (match) => {
                return '\\u' + ('0000' + match.charCodeAt(0).toString(16)).slice(-4);
            });
    }

    private visitValue(value: any): string {
        if (value === null) {
            return 'null';
        }

        if (value === undefined) {
            return 'null';
        }

        if (typeof value === 'boolean') {
            return value.toString();
        }

        if (typeof value === 'number') {
            if (!isFinite(value)) {
                return 'null'; // JSON doesn't support Infinity or NaN
            }
            return value.toString();
        }

        if (typeof value === 'string') {
            return `"${this.escapeString(value)}"`;
        }

        if (value instanceof Date) {
            return `"${value.toISOString()}"`;
        }

        if (Array.isArray(value)) {
            return this.visitArray(value);
        }

        if (typeof value === 'object') {
            return this.visitObject(value);
        }

        return 'null';
    }

    private visitArray(arr: any[]): string {
        if (arr.length === 0) {
            return '[]';
        }

        this.level++;
        const elements = arr.map(item => {
            return `${this.getIndent()}${this.visitValue(item)}`;
        });
        this.level--;

        return `[\n${elements.join(',\n')}\n${this.getIndent()}]`;
    }

    private visitObject(obj: any): string {
        const keys = Object.keys(obj);
        if (keys.length === 0) {
            return '{}';
        }

        this.level++;
        const properties = keys
            .filter(key => obj[key] !== undefined)
            .sort() // Sort keys for consistent output
            .map(key => {
                const value = this.visitValue(obj[key]);
                return `${this.getIndent()}"${this.escapeString(key)}": ${value}`;
            });
        this.level--;

        return `{\n${properties.join(',\n')}\n${this.getIndent()}}`;
    }

    public build(obj: any): string {
        this.level = 0;
        return this.visitValue(obj);
    }
}

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

        // Convert headers to a plain object
        const headers: { [key: string]: any } = {};
        if (parsed.headers) {
            for (const [key, value] of parsed.headers) {
                headers[key] = value;
            }
        }

        // Convert to our JSON format
        const smtpMessage: SMTPMessage = {
            headers,
            subject: parsed.subject,
            from: parsed.from,
            to: parsed.to,
            cc: parsed.cc,
            bcc: parsed.bcc,
            date: parsed.date,
            messageId: parsed.messageId,
            inReplyTo: parsed.inReplyTo,
            references: parsed.references,
            text: parsed.text,
            html: parsed.html,
            textAsHtml: parsed.textAsHtml,
            attachments: parsed.attachments.map((att: Attachment) => ({
                filename: att.filename,
                contentType: att.contentType,
                contentDisposition: att.contentDisposition,
                checksum: att.checksum,
                size: att.size,
                content: att.content ? att.content.toString('base64') : undefined,
                cid: att.cid,
                related: att.related
            }))
        };

        // Output as JSON to stdout using functional JSON builder
        console.log(buildSMTPJSON(smtpMessage, 2));

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