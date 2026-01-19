import { NextResponse } from 'next/server';
import { AccessToken, type AccessTokenOptions, type VideoGrant } from 'livekit-server-sdk';
import { RoomConfiguration } from '@livekit/protocol';

// NOTE: you are expected to define the following environment variables in `.env.local`:
const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_API_URL = process.env.LIVEKIT_API_URL;
const LIVEKIT_URL = process.env.LIVEKIT_URL;

// don't cache the results
export const revalidate = 0;

export type ConnectionDetails = {
  serverUrl: string;
  roomName: string;
  participantName: string;
  participantToken: string;
  metadata:string;
};

export async function POST(req: Request) {
  try {
    if (LIVEKIT_API_URL === undefined) {
      throw new Error('LIVEKIT_URL is not defined');
    }
    // if (API_KEY === undefined) {
    //   throw new Error('LIVEKIT_API_KEY is not defined');
    // }
    // if (API_SECRET === undefined) {
    //   throw new Error('LIVEKIT_API_SECRET is not defined');
    // }

    // Parse agent configuration from request body
    const body = await req.json();
    const agentName: string = body?.room_config?.agents?.[0]?.agent_name;

    // // Generate participant token
    // const participantName = 'user';
    // const participantIdentity = `voice_assistant_user_${Math.floor(Math.random() * 10_000)}`;
    // const roomName = `voice_assistant_room_${Math.floor(Math.random() * 10_000)}`;

    // const participantToken = await createParticipantToken(
    //   { identity: participantIdentity, name: participantName },
    //   roomName,
    //   agentName
    // );

    const token_data = await fetch(`${LIVEKIT_API_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_token: '8bbb2a89c0b135bb93040312e1f9f9baa5fa7df777c5aa6f6dd8017dd449edc6|335a3eacbbb8062f6a3f9114d7ed274353449d180bbc05a32c9f4ee832256eb7110674ce17459dc5cd1944ebb3e375cb811d8d29eb99ee15ee71e4bc84ae749612f2a9d0178ae88b22b9c532c1ef46d3e4aa8d1ac3fba5c52b9155dba70ae40e0c7d8668c332adc6b31abc16cad48c5f5e0244d60b9a6ec6149894f2bda998ff',
        profile_ref_no: 'a64c41d2-3b8f-4556-9b59-393f5b96dad8',
        aeskey: 'G9vtFTgJJlGjqYPh9UGLECztupAySfyxoxgs2szyG28',
        nonce_key: 'nonce',
        investor_name: 'Taksha Limbashia',
        agent_name: agentName,
      }),
    }).then((res) => res.text());

    var token_data_json = JSON.parse(token_data);

    
    // Return connection details
    const data: ConnectionDetails = {
      serverUrl: LIVEKIT_URL || '',
      roomName: token_data_json.room_name || '',
      participantToken: token_data_json.token || '',
      participantName: token_data_json.participant_name || '',
      metadata: "session_token:aeskey:ref_no"
    };
    const headers = new Headers({
      'Cache-Control': 'no-store',
    });
    return NextResponse.json(data, { headers });
  } catch (error) {
    if (error instanceof Error) {
      // console.error(error);
      return new NextResponse(error.message, { status: 500 });
    }
  }
}

function createParticipantToken(
  userInfo: AccessTokenOptions,
  roomName: string,
  agentName?: string
): Promise<string> {
  const at = new AccessToken(API_KEY, API_SECRET, {
    ...userInfo,
    ttl: '15m',
  });
  const grant: VideoGrant = {
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canPublishData: true,
    canSubscribe: true,
  };
  at.addGrant(grant);

  if (agentName) {
    at.roomConfig = new RoomConfiguration({
      agents: [{ agentName }],
    });
  }

  return at.toJwt();
}
