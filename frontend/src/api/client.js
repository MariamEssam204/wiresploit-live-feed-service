/**
 * Module: client
 * Purpose: Thin HTTP/SSE client for the main Backend (proxied at /api by
 *          Vite in development and by nginx in the container).
 * Owner: Full Stack team
 */

const API_BASE_URL = '/api'
const DEFAULT_RECENT_PACKET_LIMIT = 500
const DEFAULT_CONTEXT_EVENT_LIMIT = 10000

async function readJson(response, requestName) {
  if (!response.ok) throw new Error(`${requestName} failed: ${response.status}`)
  return response.json()
}

// TODO(backend owner): the live-feed service has no capture start/stop
// endpoint yet. Start/Stop currently only gate what the UI shows.
/** Start capture. No Backend call yet (see TODO above). */
export async function sendCaptureStart() {}

/** Stop capture. No Backend call yet (see TODO above). */
export async function sendCaptureStop() {}

/**
 * Read the most recent packets straight from Elasticsearch.
 * @param {number} [limit] Maximum packets to return.
 * @returns {Promise<object[]>} Packets, oldest first as stored.
 */
export async function readRecentPackets(limit = DEFAULT_RECENT_PACKET_LIMIT) {
  const response = await fetch(`${API_BASE_URL}/packets?limit=${limit}`)
  const data = await readJson(response, 'packets')
  return data.packets || []
}

/**
 * Run the scan engine over the stored events.
 * @returns {Promise<{findings: object[], packets_scanned: number, rules_loaded: number}>}
 */
export async function readFindings() {
  const response = await fetch(`${API_BASE_URL}/findings`)
  return readJson(response, 'findings')
}

/**
 * Run the Context Analysis engine: ordered events plus the correlated
 * activities each one belongs to.
 * @param {number} [limit] Maximum events to analyse.
 * @returns {Promise<{events: object[], activities: object[], endpoints: string[],
 *   protocols: string[], stats: object, error?: string}>}
 */
export async function readContextAnalysis(limit = DEFAULT_CONTEXT_EVENT_LIMIT) {
  const response = await fetch(`${API_BASE_URL}/context-analysis?limit=${limit}`)
  return readJson(response, 'context analysis')
}

/**
 * Substring search inside payloads, run server-side against Elasticsearch.
 * @param {string} query Text to look for.
 * @returns {Promise<object[]>} Matching packets.
 */
export async function readMatchingPackets(query) {
  const response = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(query)}`)
  const data = await readJson(response, 'search')
  return data.results || []
}

// Live-feed events have no id; node + nanosecond timestamp is unique per packet.
function addPacketId(packet) {
  return { ...packet, id: `${packet.node_id}-${packet.timestamp_ns}` }
}

/**
 * Open the live SSE stream of the live-feed service. Each frame is unnamed
 * and carries a JSON array: one batch of packets, already in timestamp order.
 * @param {object} handlers
 * @param {(packet: object) => void} handlers.onPacket Called once per packet.
 * @param {() => void} [handlers.onOpen]
 * @param {(error: Event) => void} [handlers.onError]
 * @param {(error: Error) => void} [handlers.onMalformedFrame] Called when a
 *   frame cannot be parsed, instead of dropping it silently.
 * @returns {EventSource} The open stream; call close() to stop it.
 */
export function startPacketStream({ onPacket, onOpen, onError, onMalformedFrame }) {
  const eventSource = new EventSource(`${API_BASE_URL}/stream`)
  eventSource.onopen = () => onOpen?.()
  eventSource.onmessage = (event) => {
    try {
      JSON.parse(event.data).forEach((packet) => onPacket(addPacketId(packet)))
    } catch (error) {
      if (onMalformedFrame) onMalformedFrame(error)
      else console.warn('Dropped malformed stream frame', error)
    }
  }
  eventSource.onerror = (error) => onError?.(error)
  return eventSource
}
