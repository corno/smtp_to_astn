/**
 * Example showing the benefits of the normalizer layer
 */

import { simpleParser } from 'mailparser';
import { normalizeMailparserOutput } from './normalizer.js';

// Example raw email data
const rawEmail = `From: sender@example.com
To: recipient1@example.com, recipient2@example.com
Subject: Normalization Example
References: <msg1@example.com> <msg2@example.com>

Test message content`;

async function demonstrateNormalization() {
    const parsed = await simpleParser(rawEmail);
    const normalized = normalizeMailparserOutput(parsed);
    
    console.log('=== BEFORE NORMALIZATION (Raw Mailparser) ===');
    console.log('From:', parsed.from);
    console.log('To:', parsed.to);
    console.log('References type:', typeof parsed.references, parsed.references);
    
    console.log('\n=== AFTER NORMALIZATION ===');
    console.log('From (always array):', normalized.from);
    console.log('To (always array):', normalized.to);
    console.log('References (always array):', normalized.references);
    
    console.log('\n=== BENEFITS ===');
    console.log('1. Consistent types: All address fields are arrays');
    console.log('2. Predictable references: Always string[]');
    console.log('3. Clean attachments: Base64 encoded content');
    console.log('4. Normalized structure: Same format regardless of input');
}

// Uncomment to run demonstration
// demonstrateNormalization().catch(console.error);