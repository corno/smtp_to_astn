import { ParsedMail } from 'mailparser'
import { normalizeMailparserOutput } from './native/normalize.js'
import * as transform from './transformations/normalized_smtp_mail/astn.js'

import * as t_asnt_to_fp from "astn/dist/transformations/sealed_target/fountain_pen_block"
import * as serialize_fp from "pareto-fountain-pen/dist/serialize/block"

export function smtp_to_astn(parsedMail: ParsedMail): string {
    try {
        // Normalize the mailparser output to consistent format
        const normalized = normalizeMailparserOutput(parsedMail)

        // Convert normalized mail to ASTN value format
        const astn_value = transform.Mail(normalized)

        const fp_block = t_asnt_to_fp.Document(
            astn_value,
            { 
            }
        )

        const serialized = serialize_fp.Block(
            fp_block,
            {
                'indentation': '  ',
                'newline': '\n',
            }
        )

        return serialized

    } catch (error) {
        throw new Error(`Error converting email to ASTN: ${error}`)
    }
}