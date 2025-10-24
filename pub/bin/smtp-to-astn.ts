#!/usr/bin/env node

import { simpleParser } from 'mailparser'
import { smtp_to_astn } from '../src/smtp_to_astn.js'

async function main(): Promise<void> {
    try {
        // Read from stdin
        const stdinData: Buffer[] = []

        for await (const chunk of process.stdin) {
            stdinData.push(chunk)
        }

        const emailContent = Buffer.concat(stdinData).toString('utf8')

        if (emailContent.length === 0) {
            console.error('No data received from stdin')
            process.exit(1)
        }

        // Parse the email content
        const parsedMail = await simpleParser(emailContent)

        // Convert parsed email to ASTN
        const result = smtp_to_astn(parsedMail)

        // Output to stdout
        console.log(result)

    } catch (error) {
        console.error('Error:', error instanceof Error ? error.message : String(error))
        process.exit(1)
    }
}

// Handle process termination gracefully
process.on('SIGINT', () => {
    process.exit(0)
})

process.on('SIGTERM', () => {
    process.exit(0)
})

// Main execution
main().catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
})