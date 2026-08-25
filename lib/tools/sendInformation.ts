import { university } from '@/config/university'
import { str, type ToolDefinition } from './types'

/**
 * MOCK — replace with an SMS or WhatsApp provider.
 *
 * Returns what would have been sent. Swap the body of `run` for Twilio, Unifonic,
 * 360dialog or the WhatsApp Business API and keep the shape.
 *
 * PRODUCTION NOTE: sending to a number the caller reads out is a way to spam
 * strangers. Send to the number on the student's record, or verify the one
 * given, before this goes anywhere real. See docs/SECURITY.md.
 */

const LINKS: Record<string, { label: string; url: string }> = {
  admission: { label: 'Admission requirements and how to apply', url: university.contact.admissionsUrl },
  application: { label: 'Application instructions', url: `${university.contact.admissionsUrl}#apply` },
  support: { label: 'Student support', url: university.contact.supportUrl },
  contact: { label: 'University contact details', url: `${university.website}/contact` },
}

export const sendInformation: ToolDefinition = {
  name: 'send_information',
  description:
    'Send a link or details to the caller by SMS or WhatsApp. Confirm the number back to them before sending.',
  args: {
    topic: `What to send: ${Object.keys(LINKS).join(', ')}`,
    phone: 'The number to send to, in international format',
    channel: 'Optional: sms or whatsapp. Defaults to sms.',
  },
  mock: true,

  async run(args) {
    const topic = str(args.topic).toLowerCase()
    const phone = str(args.phone)
    const channel = str(args.channel).toLowerCase() === 'whatsapp' ? 'whatsapp' : 'sms'

    const link = LINKS[topic]
    if (!link) {
      return { ok: false, mock: true, error: `Unknown topic "${topic}". Valid: ${Object.keys(LINKS).join(', ')}` }
    }
    if (!/^\+?\d[\d\s-]{7,}$/.test(phone)) {
      return { ok: false, mock: true, error: 'Need a phone number in international format, e.g. +9665…' }
    }

    return {
      ok: true,
      mock: true,
      data: {
        sent: true,
        channel,
        to: phone,
        topic,
        label: link.label,
        url: link.url,
        note: 'Simulated send. Wire to your SMS or WhatsApp provider for a real one.',
      },
    }
  },
}
