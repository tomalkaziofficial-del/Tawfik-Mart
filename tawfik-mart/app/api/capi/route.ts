import { NextResponse } from 'next/server';
import crypto from 'crypto';

const PIXEL_ID = '1121693230422858';
const ACCESS_TOKEN = 'EAAZAQNyVYCSwBSmZBzIY3E7JzEJF816azZCZA5HD9XqhyRQxjEsGluCEcwlCZBw0dDZCAdkhh4sDfPgyBoLDxv5vp6g1FEa3ZAw2ze7yAZAfV9hcxDeaEi1AOka9ZCMLPM1h7AwhajZCPtm7TvtZAhFcWH0mDGRVkNAD4k2xgH5I6AkOZA6NehMLSHNDc92UFqZAoUx5UyQZDZD';

function hashData(data: string) {
  if (!data) return '';
  return crypto.createHash('sha256').update(data.trim().toLowerCase()).digest('hex');
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { eventName, eventID, value, currency, ip, userAgent, phone } = body;

    const eventData = {
      data: [
        {
          event_name: eventName || 'Purchase',
          event_time: Math.floor(Date.now() / 1000),
          event_id: eventID,
          action_source: 'website',
          user_data: {
            client_ip_address: ip && ip !== 'Unknown' ? ip : undefined,
            client_user_agent: userAgent || undefined,
            ph: phone ? [hashData(phone)] : undefined,
          },
          custom_data: {
            currency: currency || 'BDT',
            value: Number(value) || 0,
          },
        },
      ],
    };

    const response = await fetch(
      `https://graph.facebook.com/v19.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error('CAPI Error Response:', result);
      return NextResponse.json({ success: false, error: result }, { status: response.status });
    }

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error('Server Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}