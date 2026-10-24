import type { z } from 'zod';
import type { ProjectRecord } from '~~/server/repositories/project/records';
import type { ProjectListItem } from '~~/shared/contracts/project';
import type { projectListDtoSchema, projectMapDtoSchema } from '../dto/screen-map.dto';

export function toProjectRecord(dto: z.infer<typeof projectMapDtoSchema>): ProjectRecord {
  const { data } = dto;

  return {
    code: data.code,
    name: data.name,
    description: data.description,
    myRole: data.myRole,
    permissions: data.permissions,
    archivedAt: data.archivedAt,
    concepts: data.concepts,
    screens: data.screens.map((screen) => ({
      ...screen,
      points: screen.points.map((point) => ({ ...point, box: [...point.box] })),
    })),
  };
}

export function toProjectSummaries(dto: z.infer<typeof projectListDtoSchema>): ProjectListItem[] {
  return dto.data.map(({ code, name, description, screenCount, pointCount, myRole, permissions, archivedAt, memberCount, managers }) => ({
    code,
    name,
    description,
    screenCount,
    pointCount,
    myRole,
    permissions,
    archivedAt,
    memberCount,
    managers,
  }));
}
