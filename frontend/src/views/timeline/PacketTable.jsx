/**
 * Module: PacketTable
 * Purpose: The scrolling packet table of the Live timeline.
 * Owner: Full Stack team
 */
import { useEffect, useRef, useState } from 'react'
import LaneTag from '../../components/LaneTag.jsx'
import { buildPsfPreview, formatClockTime } from '../../lib/format.js'

const COLUMNS = ['No.', 'Timestamp', 'Node', 'Event', 'Protocol', 'Duration', 'Length', 'PSF']
// Within this distance of the bottom, the table counts as "following" the feed.
const FOLLOW_THRESHOLD_PX = 40
// How long the "late packet inserted" notice stays if not clicked.
const LATE_NOTICE_TIMEOUT_MS = 10000

/**
 * @param {object} props
 * @param {object[]} props.rows Packets to show, in display order.
 * @param {string | null} props.selectedPacketId
 * @param {(packetId: string) => void} props.onSelectPacket
 * @param {boolean} props.shouldAutoScroll Keep the newest row in view.
 * @param {string} props.emptyMessage Shown when there are no rows.
 */
export default function PacketTable({ rows, selectedPacketId, onSelectPacket, shouldAutoScroll, emptyMessage }) {
  const scrollContainer = useRef(null)
  // True while the analyst is at the bottom. Scrolling up stops auto-scroll,
  // so looking at an older (or late) row is not interrupted by new arrivals.
  const isFollowingFeed = useRef(true)
  // Late packets already counted, so each one is announced only once.
  const announcedLateIds = useRef(new Set())
  const [lateNotice, setLateNotice] = useState({ count: 0, lastLateId: null })

  const handleScroll = () => {
    const element = scrollContainer.current
    if (!element) return
    const distanceFromBottomPx = element.scrollHeight - element.scrollTop - element.clientHeight
    isFollowingFeed.current = distanceFromBottomPx < FOLLOW_THRESHOLD_PX
  }

  useEffect(() => {
    if (shouldAutoScroll && isFollowingFeed.current && scrollContainer.current) {
      scrollContainer.current.scrollTop = scrollContainer.current.scrollHeight
    }
  }, [rows.length, shouldAutoScroll])

  // A late packet lands ABOVE the bottom, where the analyst is not looking:
  // count it so the notice can point to it.
  useEffect(() => {
    const newLatePackets = rows.filter(
      (packet) => packet.late && !announcedLateIds.current.has(String(packet.id)),
    )
    if (newLatePackets.length === 0) return
    newLatePackets.forEach((packet) => announcedLateIds.current.add(String(packet.id)))
    setLateNotice((previous) => ({
      count: previous.count + newLatePackets.length,
      lastLateId: newLatePackets[newLatePackets.length - 1].id,
    }))
  }, [rows])

  useEffect(() => {
    if (lateNotice.count === 0) return undefined
    const timer = setTimeout(() => setLateNotice({ count: 0, lastLateId: null }), LATE_NOTICE_TIMEOUT_MS)
    return () => clearTimeout(timer)
  }, [lateNotice])

  const showLatestLatePacket = () => {
    const packetId = lateNotice.lastLateId
    setLateNotice({ count: 0, lastLateId: null })
    if (packetId == null || !scrollContainer.current) return
    const row = scrollContainer.current.querySelector(`[data-packet-id="${CSS.escape(String(packetId))}"]`)
    // Stop following first, so the next arrival does not scroll away from it.
    isFollowingFeed.current = false
    row?.scrollIntoView({ block: 'center' })
    onSelectPacket(packetId)
  }

  return (
    <div className="packet-table-wrap" ref={scrollContainer} onScroll={handleScroll}>
      <table className="data-table is-mono packet-table">
        <thead>
          <tr>
            {COLUMNS.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((packet) => {
            const isSelected = String(packet.id) === String(selectedPacketId)
            const rowClass =
              'is-clickable' +
              (isSelected ? ' is-selected' : '') +
              (packet.isLive ? ' is-new' : '') +
              (packet.late ? ' is-late' : '')
            return (
              <tr
                key={packet.id}
                data-packet-id={String(packet.id)}
                className={rowClass}
                onClick={() => onSelectPacket(packet.id)}
              >
                <td className="faint" title={String(packet.id)}>
                  {packet.rowNumber ?? packet.id}
                </td>
                <td>{formatClockTime(packet.timestamp)}</td>
                <td>{packet.node_id ?? ''}</td>
                <td>
                  {packet.malformed && (
                    <span className="malformed-flag" title="payload_hex missing or invalid">
                      !
                    </span>
                  )}
                  {packet.event_type}
                </td>
                <td>
                  <LaneTag name={packet.protocol} />
                </td>
                <td>{packet.duration ?? ''}</td>
                <td>{packet.length_bytes ?? ''}</td>
                <td className="psf-cell" title={JSON.stringify(packet.psf)}>
                  {buildPsfPreview(packet.psf)}
                </td>
              </tr>
            )
          })}
          {rows.length === 0 && (
            <tr>
              <td colSpan={COLUMNS.length}>
                <div className="empty-hint">{emptyMessage}</div>
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {lateNotice.count > 0 && (
        <div className="late-notice-anchor">
          <button className="late-notice" onClick={showLatestLatePacket}>
            ↑ {lateNotice.count} late {lateNotice.count === 1 ? 'packet' : 'packets'} inserted above · Show
          </button>
        </div>
      )}
    </div>
  )
}
