#!/usr/bin/env node

import { simpleParser, ParsedMail, Attachment, AddressObject } from 'mailparser';
import { JSON_Value } from './json-value.js';
import { serializeJSONValue } from './serializer.js';
import { convertSMTPMessage } from './converter.js';
import { SMTPMessage, HeaderValue } from './types.js';

// Function to convert mailparser output to our tagged union format
const convertToHeaderValue = (key: string, value: any): HeaderValue => {
    const lowerKey = key.toLowerCase();
    
    // Date fields
    if (lowerKey === 'date' || lowerKey.startsWith('resent-date') || value instanceof Date) {
        return ['date', value instanceof Date ? value : new Date(value)];
    }
    
    // Address fields (single)
    if (lowerKey === 'from' || lowerKey === 'sender' || lowerKey.startsWith('resent-from') || lowerKey.startsWith('resent-sender')) {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            return ['address', value as AddressObject];
        }
    }
    
    // Address fields (multiple)
    if (lowerKey === 'to' || lowerKey === 'cc' || lowerKey === 'bcc' || lowerKey === 'reply-to' || 
        lowerKey.startsWith('resent-to') || lowerKey.startsWith('resent-cc') || lowerKey.startsWith('resent-bcc')) {
        if (Array.isArray(value)) {
            return ['address_list', value as AddressObject[]];
        } else if (value && typeof value === 'object') {
            return ['address_list', [value as AddressObject]];
        }
    }
    
    // Message ID fields
    if (lowerKey === 'message-id' || lowerKey.startsWith('resent-message-id')) {
        return ['message_id', String(value)];
    }
    
    // Message ID lists (References, In-Reply-To)
    if (lowerKey === 'references' || lowerKey === 'in-reply-to') {
        if (Array.isArray(value)) {
            return ['message_id_list', value.map(String)];
        } else if (value) {
            return ['message_id_list', [String(value)]];
        }
        return ['message_id_list', []];
    }
    
    // Content-Type
    if (lowerKey === 'content-type') {
        if (value && typeof value === 'object' && value.value) {
            return ['content_type', {
                value: value.value,
                params: value.params || undefined
            }];
        }
        return ['content_type', { value: String(value) }];
    }
    
    // MIME Version
    if (lowerKey === 'mime-version') {
        return ['mime_version', String(value)];
    }
    
    // Content encoding
    if (lowerKey === 'content-transfer-encoding') {
        return ['content_encoding', String(value)];
    }
    
    // Content disposition
    if (lowerKey === 'content-disposition') {
        if (value && typeof value === 'object' && value.value) {
            return ['content_disposition', {
                value: value.value,
                params: value.params || undefined
            }];
        }
        return ['content_disposition', { value: String(value) }];
    }
    
    // Keywords
    if (lowerKey === 'keywords') {
        if (Array.isArray(value)) {
            return ['keywords', value.map(String)];
        } else if (typeof value === 'string') {
            return ['keywords', value.split(',').map(s => s.trim())];
        }
        return ['keywords', [String(value)]];
    }
    
    // Unstructured text fields
    if (lowerKey === 'subject' || lowerKey === 'comments') {
        return ['unstructured', String(value)];
    }
    
    // Received fields (simplified - mailparser usually parses these)
    if (lowerKey === 'received') {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            return ['received', {
                from: value.from ? String(value.from) : undefined,
                by: value.by ? String(value.by) : undefined,
                via: value.via ? String(value.via) : undefined,
                with: value.with ? String(value.with) : undefined,
                id: value.id ? String(value.id) : undefined,
                for: value.for ? String(value.for) : undefined,
                date: value.date instanceof Date ? value.date : new Date()
            }];
        }
        // If it's a string (raw received header), treat as unknown
        return ['unknown', String(value)];
    }
    
    // Default: treat as unstructured text
    return ['unknown', String(value)];
};

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

        // Convert headers to our tagged union format
        const headers: { [key: string]: HeaderValue } = {};
        if (parsed.headers) {
            for (const [key, value] of parsed.headers) {
                headers[key] = convertToHeaderValue(key, value);
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