import { describe, it, expect } from 'vitest';
import {
  supervisionShardId,
  supervisionsToArchive,
  regroupSupervisions,
  mergeIntoShard
} from './supervisionShards';

const rec = (id, academicYear) => ({ id, academicYear, teacherName: `ครู ${id}` });

describe('supervisionShardId', () => {
  it('names one document per academic year', () => {
    expect(supervisionShardId('2568')).toBe('supervisions_2568');
  });
});

describe('supervisionsToArchive', () => {
  it('groups only finished academic years', () => {
    const list = [rec('a', '2567'), rec('b', '2568'), rec('c', '2569'), rec('d', '2568')];
    const byYear = supervisionsToArchive(list, '2569');

    expect(Object.keys(byYear).sort()).toEqual(['2567', '2568']);
    expect(byYear['2568'].map(r => r.id)).toEqual(['b', 'd']);
  });

  it('leaves records without an academic year in the working document', () => {
    // Legacy rows are read as belonging to the current year everywhere else.
    const byYear = supervisionsToArchive([rec('a', undefined), rec('b', '')], '2569');
    expect(byYear).toEqual({});
  });

  it('archives nothing when the current year is unknown', () => {
    expect(supervisionsToArchive([rec('a', '2567')], undefined)).toEqual({});
  });

  it('archives nothing when every record is from the current year', () => {
    expect(supervisionsToArchive([rec('a', '2569'), rec('b', '2569')], '2569')).toEqual({});
  });
});

describe('regroupSupervisions', () => {
  it('sends each record back to the document it came from', () => {
    const shardOfId = new Map([['a', '2567'], ['b', '2568']]);
    const { working, byYear } = regroupSupervisions(
      [rec('a', '2567'), rec('b', '2568'), rec('c', '2569')],
      shardOfId
    );

    expect(working.map(r => r.id)).toEqual(['c']);
    expect(byYear['2567'].map(r => r.id)).toEqual(['a']);
    expect(byYear['2568'].map(r => r.id)).toEqual(['b']);
  });

  it('puts brand new records in the working document', () => {
    const { working, byYear } = regroupSupervisions([rec('new', '2567')], new Map());
    expect(working.map(r => r.id)).toEqual(['new']);
    expect(byYear).toEqual({});
  });

  it('drops deleted records from their shard', () => {
    const shardOfId = new Map([['a', '2567'], ['b', '2567']]);
    const { byYear } = regroupSupervisions([rec('a', '2567')], shardOfId);
    expect(byYear['2567'].map(r => r.id)).toEqual(['a']);
  });

  it('leaves an emptied shard as an empty list rather than dropping it silently', () => {
    const { working, byYear } = regroupSupervisions([], new Map([['a', '2567']]));
    expect(working).toEqual([]);
    expect(byYear['2567']).toBeUndefined();
  });
});

describe('mergeIntoShard', () => {
  it('adds new records and keeps the existing order', () => {
    const merged = mergeIntoShard([rec('a', '2567'), rec('b', '2567')], [rec('c', '2567')]);
    expect(merged.map(r => r.id)).toEqual(['a', 'b', 'c']);
  });

  it('lets the incoming copy win, without duplicating it', () => {
    const existing = [{ id: 'a', status: 'pending' }];
    const merged = mergeIntoShard(existing, [{ id: 'a', status: 'completed' }]);
    expect(merged).toEqual([{ id: 'a', status: 'completed' }]);
  });
});
