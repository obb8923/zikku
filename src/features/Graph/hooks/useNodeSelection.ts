import { useMemo } from 'react';
import type { GraphLink } from '@/shared/types/graphType';

export function useNodeSelection(
  selectedNodeId: string | null,
  renderLinks: GraphLink[],
) {
  const connectedLinkIds = useMemo(() => {
    if (!selectedNodeId) {
      return new Set<string>();
    }
    return new Set(
      renderLinks
        .filter(
          (link) =>
            link.source.id === selectedNodeId || link.target.id === selectedNodeId,
        )
        .map((link) => link.id),
    );
  }, [selectedNodeId, renderLinks]);

  const connectedNodeIds = useMemo(() => {
    if (!selectedNodeId) {
      return new Set<string>();
    }
    const ids = new Set<string>([selectedNodeId]);
    renderLinks.forEach((link) => {
      if (link.source.id === selectedNodeId) {
        ids.add(link.target.id);
      } else if (link.target.id === selectedNodeId) {
        ids.add(link.source.id);
      }
    });
    return ids;
  }, [selectedNodeId, renderLinks]);

  const isSelectionActive = !!selectedNodeId;

  return {
    connectedLinkIds,
    connectedNodeIds,
    isSelectionActive,
  };
}


