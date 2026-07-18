import { sampleSnapshot, type ControlRoomSnapshot } from './contracts';

export async function loadControlRoomSnapshot(fetcher: typeof fetch = fetch): Promise<ControlRoomSnapshot> {
  const token = globalThis.sessionStorage?.getItem('maintenance_session_token');
  if (!token) return sampleSnapshot;
  const response = await fetcher('/api/maintenance/control-room', { headers: { authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error(`control_room_api_${response.status}`);
  return await response.json() as ControlRoomSnapshot;
}
