/**
 * Module: InjectionView
 * Purpose: Injection tab: one sub-tab per injection domain (Network, UART).
 * Owner: Full Stack team
 *
 * The domains and their pages are listed in ./injectionDomains.js. To add a
 * domain, add one entry there; this view needs no change.
 */
import { useState } from 'react'
import { useAppContext } from '../../app/AppContext.jsx'
import TabBar from '../../components/TabBar.jsx'
import { INJECTION_DOMAINS, findDomainById } from './injectionDomains.js'
import './injection.css'

const DEFAULT_DOMAIN_ID = INJECTION_DOMAINS[0].id

export default function InjectionView() {
  const { capture } = useAppContext()
  const [activeDomainId, setActiveDomainId] = useState(DEFAULT_DOMAIN_ID)

  const activeDomain = findDomainById(activeDomainId)
  const DomainPage = activeDomain.component

  return (
    <div className="view">
      <TabBar
        variant="secondary"
        tabs={INJECTION_DOMAINS}
        activeId={activeDomainId}
        onSelect={setActiveDomainId}
      />
      <DomainPage isCapturing={capture.isCapturing} />
    </div>
  )
}
