import { useMemo } from 'react';
import { usePersonStore } from '@stores/personStore';
import type { GraphLink, GraphNode } from '@/shared/types/graphType';
import type { FilterValue } from '@features/Graph/components/FilterDropdown';
import { GROUP_ALL_VALUE, TAG_ALL_VALUE } from '@features/Graph/components/FilterDropdown';
import { createLinkBetweenNodes } from '@stores/graphStore';
import uuid from 'react-native-uuid';

export function useGraphFilter(
  nodes: GraphNode[],
  links: GraphLink[],
  selectedFilter: FilterValue,
  canvasWidth: number,
  canvasHeight: number,
) {
  const people = usePersonStore((s) => s.people);

  // 모든 그룹과 태그 추출
  const { groups, tags } = useMemo(() => {
    const groupSet = new Set<string>();
    const tagSet = new Set<string>();

    people.forEach((person) => {
      person.properties.forEach((property) => {
        if (property.type === 'organizations') {
          property.values.forEach((value) => groupSet.add(value));
        } else if (property.type === 'tags') {
          property.values.forEach((value) => tagSet.add(value));
        }
      });
    });

    return {
      groups: Array.from(groupSet).sort(),
      tags: Array.from(tagSet).sort(),
    };
  }, [people]);

  // 렌더링될 노드와 링크
  const { renderNodes, renderLinks } = useMemo(() => {
    if (!selectedFilter) {
      return { renderNodes: nodes, renderLinks: links };
    }

    const layoutWidth = canvasWidth || 400;
    const layoutHeight = canvasHeight || 600;

    const buildGroupView = (targetGroupNames: string[]) => {
      if (targetGroupNames.length === 0) {
        return { renderNodes: [] as GraphNode[], renderLinks: [] as GraphLink[] };
      }

      // 그룹 노드 ID 생성 시 중복 방지 보장
      const groupNodeIds = new Set<string>();
      const groupNodes: GraphNode[] = targetGroupNames.map((groupName) => {
        // 그룹 노드는 'node-group-' 접두사 사용하여 태그와 명확히 구분
        const nodeId = `node-group-${groupName}`;
        if (groupNodeIds.has(nodeId)) {
          // 중복 발생 시 UUID 추가 (이론적으로는 발생하지 않아야 함)
          const uniqueId = `${nodeId}-${uuid.v4()}`;
          groupNodeIds.add(uniqueId);
          return {
            id: uniqueId,
            name: groupName,
            nodeType: 'group' as const,
            x: Math.random() * layoutWidth,
            y: Math.random() * layoutHeight,
          };
        }
        groupNodeIds.add(nodeId);
        return {
          id: nodeId,
          name: groupName,
          nodeType: 'group' as const,
          x: Math.random() * layoutWidth,
          y: Math.random() * layoutHeight,
        };
      });

      const groupNodeMap = new Map(groupNodes.map((node) => [node.name, node]));
      const visiblePersonNodes: GraphNode[] = [];
      const visiblePersonIds = new Set<string>();
      const groupLinks: GraphLink[] = [];
      const groupLinkIds = new Set<string>(); // 링크 ID 중복 방지

      // 노드 맵 생성 - 최신 노드 참조를 위해
      const nodeMap = new Map(nodes.map((n) => [n.id, n]));

      nodes.forEach((personNode) => {
        if (!personNode.personId) return;
        const person = people.find((p) => p.id === personNode.personId);
        if (!person) return;

        const organizationProperty = person.properties.find((property) => property.type === 'organizations');
        const organizations = organizationProperty?.values ?? [];
        // 중복 그룹 제거
        const uniqueOrganizations = Array.from(new Set(organizations));
        const matchedGroups = uniqueOrganizations.filter((groupName) => groupNodeMap.has(groupName));

        if (matchedGroups.length > 0) {
          // 최신 노드 참조 사용
          const latestPersonNode = nodeMap.get(personNode.id) || personNode;
          visiblePersonNodes.push(latestPersonNode);
          visiblePersonIds.add(latestPersonNode.id);

          matchedGroups.forEach((groupName) => {
            const groupNode = groupNodeMap.get(groupName);
            if (!groupNode) return;

            const linkId = `group-link-${latestPersonNode.id}-${groupNode.id}`;
            // 중복 링크 ID 체크
            if (!groupLinkIds.has(linkId)) {
              groupLinkIds.add(linkId);
              groupLinks.push(
                createLinkBetweenNodes(latestPersonNode, groupNode, linkId, 'group', 0.3)
              );
            }
          });
        }
      });

      // 관계 링크도 최신 노드 참조로 재생성
      const relationLinks = links
        .filter((link) => visiblePersonIds.has(link.source.id) && visiblePersonIds.has(link.target.id))
        .map((link) => {
          const sourceNode = nodeMap.get(link.source.id) || link.source;
          const targetNode = nodeMap.get(link.target.id) || link.target;
          return createLinkBetweenNodes(sourceNode, targetNode, link.id, link.type, link.strength);
        });

      return {
        renderNodes: [...visiblePersonNodes, ...groupNodes],
        renderLinks: [...relationLinks, ...groupLinks],
      };
    };

    const buildTagView = (targetTagNames: string[]) => {
      if (targetTagNames.length === 0) {
        return { renderNodes: [] as GraphNode[], renderLinks: [] as GraphLink[] };
      }

      // 태그 노드 ID 생성 시 중복 방지 보장
      const tagNodeIds = new Set<string>();
      const tagNodes: GraphNode[] = targetTagNames.map((tagName) => {
        // 태그 노드는 'node-tag-' 접두사 사용하여 그룹과 명확히 구분
        const nodeId = `node-tag-${tagName}`;
        if (tagNodeIds.has(nodeId)) {
          // 중복 발생 시 UUID 추가 (이론적으로는 발생하지 않아야 함)
          const uniqueId = `${nodeId}-${uuid.v4()}`;
          tagNodeIds.add(uniqueId);
          return {
            id: uniqueId,
            name: tagName,
            nodeType: 'tag' as const,
            x: Math.random() * layoutWidth,
            y: Math.random() * layoutHeight,
          };
        }
        tagNodeIds.add(nodeId);
        return {
          id: nodeId,
          name: tagName,
          nodeType: 'tag' as const,
          x: Math.random() * layoutWidth,
          y: Math.random() * layoutHeight,
        };
      });

      const tagNodeMap = new Map(tagNodes.map((node) => [node.name, node]));
      const visiblePersonNodes: GraphNode[] = [];
      const visiblePersonIds = new Set<string>();
      const tagLinks: GraphLink[] = [];
      const tagLinkIds = new Set<string>(); // 링크 ID 중복 방지

      // 노드 맵 생성 - 최신 노드 참조를 위해
      const nodeMap = new Map(nodes.map((n) => [n.id, n]));

      nodes.forEach((personNode) => {
        if (!personNode.personId) return;
        const person = people.find((p) => p.id === personNode.personId);
        if (!person) return;

        const tagProperty = person.properties.find((property) => property.type === 'tags');
        const personTags = tagProperty?.values ?? [];
        // 중복 태그 제거
        const uniquePersonTags = Array.from(new Set(personTags));
        const matchedTags = uniquePersonTags.filter((tagName) => tagNodeMap.has(tagName));

        if (matchedTags.length > 0) {
          // 최신 노드 참조 사용
          const latestPersonNode = nodeMap.get(personNode.id) || personNode;
          visiblePersonNodes.push(latestPersonNode);
          visiblePersonIds.add(latestPersonNode.id);

          matchedTags.forEach((tagName) => {
            const tagNode = tagNodeMap.get(tagName);
            if (!tagNode) return;

            const linkId = `tag-link-${latestPersonNode.id}-${tagNode.id}`;
            // 중복 링크 ID 체크
            if (!tagLinkIds.has(linkId)) {
              tagLinkIds.add(linkId);
              tagLinks.push(
                createLinkBetweenNodes(latestPersonNode, tagNode, linkId, 'tag', 0.3)
              );
            }
          });
        }
      });

      // 관계 링크도 최신 노드 참조로 재생성
      const relationLinks = links
        .filter((link) => visiblePersonIds.has(link.source.id) && visiblePersonIds.has(link.target.id))
        .map((link) => {
          const sourceNode = nodeMap.get(link.source.id) || link.source;
          const targetNode = nodeMap.get(link.target.id) || link.target;
          return createLinkBetweenNodes(sourceNode, targetNode, link.id, link.type, link.strength);
        });

      return {
        renderNodes: [...visiblePersonNodes, ...tagNodes],
        renderLinks: [...relationLinks, ...tagLinks],
      };
    };

    if (selectedFilter.type === 'group') {
      const targetGroupNames =
        selectedFilter.value === GROUP_ALL_VALUE
          ? groups
          : selectedFilter.value
            ? [selectedFilter.value]
            : [];
      return buildGroupView(targetGroupNames);
    }

    if (selectedFilter.type === 'tag') {
      const targetTagNames =
        selectedFilter.value === TAG_ALL_VALUE
          ? tags
          : selectedFilter.value
            ? [selectedFilter.value]
            : [];
      return buildTagView(targetTagNames);
    }

    return { renderNodes: nodes, renderLinks: links };
  }, [selectedFilter, nodes, links, people, groups, tags, canvasWidth, canvasHeight]);

  return {
    groups,
    tags,
    renderNodes,
    renderLinks,
  };
}

