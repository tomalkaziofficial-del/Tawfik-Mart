import { NextResponse } from 'next/server';
import crypto from 'crypto';

const PIXEL_ID = '1121693230422858';
const ACCESS_TOKEN = 'EAAZAQNyVYCSwBSgntxxYmkIFL4r2jO70z5Jq1vpksZChS2z8X7fO3UZAlbz1Hdgh9I3ThXFD2cZCiMvP2CBZC2vlNqdZC3soVJJuaboGhjIvDspAYLfEOOwVKtAE4kzFqAWEDMuILxegBaLEsqkReiemmgwGxaOYqZCwG2YrTXZAhkOHeOsicCyyLMP2pu22dcdxtwZDZD';

// ইউজারের ডেটা হ্যাশ করার ফাংশন (ফেসবুকের নিয়ম অনুযায়ী)
const hashData = (data: string) => {
  if (!data) return '';
  return crypto.createHash('sha256').update(data.toLowerCase().trim()).digest('hex');
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { eventName, eventID, value, currency, ip, userAgent, phone } = body;

    const currentTimestamp = Math.floor(Date.now() / 1000);

    const eventData = {
      data: [
        {
          event_name: eventName,
          event_time: currentTimestamp,
          action_source: "website",
          event_id: eventID, 
          user_data: {
            client_ip_address: ip,
            client_user_agent: userAgent,
            ph: phone ? [hashData(phone)] : undefined, 
          },
          custom_data: {
            currency: currency,
            value: value,
          },
        },
      ],
    };

    const response = await fetch(`https://graph.facebook.com/v19.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('CAPI Error Response:', result);
      return NextResponse.json({ success: false, error: result }, { status: response.status });
    }

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Server Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}