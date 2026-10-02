import React from 'react';
import {ExternalLink} from 'lucide-react';

export const reputationCardClass='bg-white border border-[#d4e0ed] rounded-[24px] shadow-[rgba(71,103,136,0.04)_0px_4px_5px_0px,rgba(71,103,136,0.03)_0px_8px_15px_0px,rgba(71,103,136,0.08)_0px_30px_50px_0px]';

export function reputationSourceDomain(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'Источник';
  }
}

export function ReputationSourceLink({url, className = ''}: {url: string; className?: string}) {
  const domain = reputationSourceDomain(url);
  return <a href={url} target="_blank" rel="noreferrer" title={url} aria-label={`Открыть источник: ${domain}`} className={`inline-flex max-w-full items-center gap-1.5 text-xs font-semibold text-[#006bff] hover:text-[#004eba] hover:underline focus-visible:rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#006bff] ${className}`}>
    <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true"/>
    <span className="shrink-0">Открыть источник</span>
    <span className="max-w-[14rem] truncate font-normal text-[#476788]" aria-hidden="true">· {domain}</span>
  </a>;
}
