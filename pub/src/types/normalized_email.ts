import * as _et from 'exupery-core-types'

/**
 * Normalized types that provide a cleaner, more consistent interface
 * than the raw mailparser output
 */

export interface Address {
    address: _et.Optional_Value<string>
    name: string
}

export interface Address_Object {
    value: _et.Array<Address>
    html: string
    text: string
}

export interface Attachment {
    filename: _et.Optional_Value<string>
    contentType: string
    contentDisposition: _et.Optional_Value<string>
    checksum: string
    size: number
    content: _et.Optional_Value<string> // base64 encoded
    cid: _et.Optional_Value<string>
    related: _et.Optional_Value<boolean>
}

export interface Mail {
    headers: _et.Dictionary<Header_Value> // Raw headers map
    subject: _et.Optional_Value<string>
    from: _et.Optional_Value<Address_Object>      // Single object (RFC 5322 compliant)
    to: _et.Array<Address_Object>      // Always array
    cc: _et.Array<Address_Object>      // Always array
    bcc: _et.Array<Address_Object>     // Always array
    replyTo: _et.Array<Address_Object> // Always array
    date: _et.Optional_Value<Date>
    messageId: _et.Optional_Value<string>
    inReplyTo: _et.Optional_Value<string>
    references: _et.Array<string>               // Always array
    text: _et.Optional_Value<string>
    html: _et.Optional_Value<string> // there is specific case where the html can be false, I'm not handling that
    textAsHtml: _et.Optional_Value<string>
    attachments: _et.Array<Attachment>
}

// Tagged union for different header value types
export type Header_Value = 
    | ["resent from", string]
    | ["resent to", string]
    | ["x-mailer", string]
    | ["unstructured", string]                    // Simple text headers like Subject, Comments
    | ["date", Date]                             // Date headers
    | ["address", Address_Object]                 // Single address headers like From, Sender
    | ["address list", _et.Array<Address_Object>]          // Multiple address headers like To, Cc
    | ["message id", string]                     // Message-ID format
    | ["message id list", _et.Array<string>]              // References, In-Reply-To (can be multiple)
    | ["content type", {                         // Content-Type with parameters
        value: string
        params: _et.Dictionary<string>
    }]
    | ["mime version", string]                   // MIME-Version
    | ["content encoding", string]               // Content-Transfer-Encoding
    | ["content disposition", {                  // Content-Disposition with parameters
        value: string
        params: _et.Dictionary<string>
    }]
    | ["received", {                             // Received trace fields
        from: _et.Optional_Value<string>
        by: _et.Optional_Value<string>
        via: _et.Optional_Value<string>
        with: _et.Optional_Value<string>
        id: _et.Optional_Value<string>
        for: _et.Optional_Value<string>
        date: Date
    }]
    | ["raw received", string]               // Raw Received header
    | ["keywords", _et.Array<string>]                     // Keywords field (comma-separated)
    | ["unknown", {
        'key': string
        'value': string
    }]                       // Fallback for unrecognized headers