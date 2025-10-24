import * as _et from 'exupery-core-types'
import * as _ea from 'exupery-core-alg'

import * as d_in from "../../types/normalized_email"

import * as d_out from "astn/dist/generated/interface/schemas/sealed_target/data_types/target"


// Utility functions for converting primitive types
const string = (value: string): d_out.Value => {
    return ['text', {
        'delimiter': ['quote', null],
        'value': value
    }]
}

const number = (value: number): d_out.Value => {
    return ['text', {
        'delimiter': ['none', null],
        'value': "" + value
    }]
}

const boolean = (value: boolean): d_out.Value => {
    return ['text', {
        'delimiter': ['none', null],
        'value': value ? "true" : "false"
    }]
}

const state = (state_name: string, value: d_out.Value): d_out.Value => {
    return ['state', {
        'state': state_name,
        'value': value
    }]
}

const nothing = (): d_out.Value => {
    return ['nothing', null]
}

const date = (value: Date): d_out.Value => {
    return ['text', {
        'delimiter': ['quote', null],
        'value': value.toISOString()
    }]
}

const object = <T>(obj: _et.Dictionary<T>, converter: (value: T) => d_out.Value): d_out.Value => {
    return ['dictionary', obj.map(($) => converter($)).to_array(() => 1)]
}


const verbose_group = (obj: _et.Dictionary<d_out.Value>): d_out.Value => {
    return ['verbose group', obj.to_array(() => 1)]
}

const array = <T>(arr: _et.Array<T>, converter: (item: T) => d_out.Value): d_out.Value => {
    return ['list', arr.map(converter)]
}

// Convert Address
const Address = (address: d_in.Address): d_out.Value => {

    return verbose_group(_ea.dictionary_literal({
        "name": string(address.name),
        "address": address.address.transform(
            ($) => string($),
            () => nothing()
        )
    }))
}

// Convert Address_Object
const Address_Object = (addressObj: d_in.Address_Object): d_out.Value => {
    return verbose_group(_ea.dictionary_literal({
        "value": array(addressObj.value, Address),
        "html": string(addressObj.html),
        "text": string(addressObj.text)
    }))
}

// Convert Attachment
const Attachment = (attachment: d_in.Attachment): d_out.Value => {


    return verbose_group(_ea.dictionary_literal({
        filename: attachment.filename.transform(
            ($) => string($),
            () => nothing()
        ),
        contentType: string(attachment.contentType),
        contentDisposition: attachment.contentDisposition.transform(
            ($) => string($),
            () => nothing()
        ),
        checksum: string(attachment.checksum),
        size: number(attachment.size),
        content: attachment.content.transform(
            ($) => string($),
            () => nothing()
        ),
        cid: attachment.cid.transform(
            ($) => string($),
            () => nothing()
        ),
        related: attachment.related.transform(
            ($) => boolean($),
            () => boolean(false)
        )
    }))
}

// Convert Header_Value
const Header_Value = (headerValue: d_in.Header_Value): d_out.Value => {
    const [headerType, value] = headerValue

    switch (headerType) {
        case 'unstructured':
            return state(headerType, string(value)) 

        case 'date':
            return state(headerType, date(value))

        case 'address':
            return state(headerType, Address_Object(value))

        case 'address_list':
            return state(headerType, array(value, Address_Object))

        case 'message_id':
            return state(headerType, string(value))

        case 'message_id_list':
            return state(headerType, array(value, string))

        case 'content_type':
            const contentTypeObj: { [key: string]: d_out.Value } = {
                value: string(value.value),
                params: object(value.params, ($) => string($))
            }
            return state(headerType, verbose_group(_ea.dictionary_literal(contentTypeObj)))

        case 'mime_version':
        case 'content_encoding':
            return state(headerType, string(value))

        case 'content_disposition':
            const dispositionObj: { [key: string]: d_out.Value } = {
                value: string(value.value),
                params: object(value.params, ($) => string($))
            }
            return state(headerType, verbose_group(_ea.dictionary_literal(dispositionObj)))

        case 'received':
            const receivedObj: { [key: string]: d_out.Value } = {
                from: value.from.transform(
                    ($) => string($),
                    () => nothing()
                ),
                by: value.by.transform(
                    ($) => string($),
                    () => nothing()
                ),
                via: value.via.transform(
                    ($) => string($),
                    () => nothing()
                ),
                with: value.with.transform(
                    ($) => string($),
                    () => nothing()
                ),
                id: value.id.transform(
                    ($) => string($),
                    () => nothing()
                ),
                for: value.for.transform(
                    ($) => string($),
                    () => nothing()
                ),
                date: date(value.date)
            }
            return state(headerType, verbose_group(_ea.dictionary_literal(receivedObj)))

        case 'keywords':
            return state(headerType, array(value, string))

        case 'unknown':
            return state(headerType, string(value))

        default:
            // Fallback for any unhandled header types
            return state('unknown', string(String(value)))
    }
}

// Convert headers object
const headers = (headers: _et.Dictionary<d_in.Header_Value>): d_out.Value => {
    return object(headers, Header_Value)
}

// Main conversion function
export const Mail = (mail: d_in.Mail): d_out.Value => {
    const obj: { [key: string]: d_out.Value } = {
        headers: headers(mail.headers),
        subject: mail.subject.transform(
            ($) => string($),
            () => nothing()
        ),
        from: mail.from.transform(
            ($) => Address_Object($),
            () => nothing()
        ),
        to: array(mail.to, Address_Object),
        cc: array(mail.cc, Address_Object),
        bcc: array(mail.bcc, Address_Object),
        replyTo: array(mail.replyTo, Address_Object),
        date: mail.date.transform(
            ($) => date($),
            () => nothing()
        ),
        messageId: mail.messageId.transform(
            ($) => string($),
            () => nothing()
        ),
        inReplyTo: mail.inReplyTo.transform(
            ($) => string($),
            () => nothing()
        ),
        references: array(mail.references, string),
        text: mail.text.transform(
            ($) => string($),
            () => nothing()
        ),
        html: mail.html.transform(
            ($) => string($),
            () => nothing()
        ),
        textAsHtml: mail.textAsHtml.transform(
            ($) => string($),
            () => nothing()
        ),
        attachments: array(mail.attachments, Attachment)
    }

    return verbose_group(_ea.dictionary_literal(obj))
}