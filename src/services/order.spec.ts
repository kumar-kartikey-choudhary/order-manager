import { describe, expect, it, vi } from 'vitest';
import { buildOrderLookupPayload } from './order';

vi.mock('@common', () => ({
  api: vi.fn(),
  commonUtil: { hasError: vi.fn() },
  useSolrSearch: vi.fn()
}));

function filtersOf(params: Parameters<typeof buildOrderLookupPayload>[0]) {
  return buildOrderLookupPayload(params).json.filter as string[];
}

function fieldsOf(params: Parameters<typeof buildOrderLookupPayload>[0] = {}) {
  return String(buildOrderLookupPayload(params).json.params.fl).split(' ');
}

describe('buildOrderLookupPayload facility filtering', () => {
  it('always scopes to sales orders', () => {
    const filters = filtersOf({});
    expect(filters).toContain('docType: ORDER');
    expect(filters).toContain('orderTypeId: SALES_ORDER');
  });

  it('does not add a facility filter when none is given', () => {
    const filters = filtersOf({});
    expect(filters.some((filter) => filter.startsWith('facilityId'))).toBe(false);
  });

  it('builds the Unfillable queue filter (single facility)', () => {
    const filters = filtersOf({ facilityIds: ['UNFILLABLE_PARKING'] });
    expect(filters).toContain('facilityId:UNFILLABLE_PARKING');
  });

  it('builds the Brokering queue filter (brokering OR rejected parking)', () => {
    const filters = filtersOf({ facilityIds: ['_NA_', 'REJECTED_PARKING'] });
    expect(filters).toContain('facilityId:(_NA_ OR REJECTED_PARKING)');
  });

  it("ignores the 'All' sentinel and empty facility values", () => {
    const filters = filtersOf({ facilityIds: ['All', '', 'UNFILLABLE_PARKING'] });
    expect(filters).toContain('facilityId:UNFILLABLE_PARKING');
    expect(filters).not.toContain('facilityId:(All OR  OR UNFILLABLE_PARKING)');
  });

  it('combines a facility preset with status and channel filters', () => {
    const filters = filtersOf({
      facilityIds: ['UNFILLABLE_PARKING'],
      status: ['ORDER_APPROVED'],
      channel: 'WEB_SALES_CHANNEL'
    });
    expect(filters).toContain('facilityId:UNFILLABLE_PARKING');
    expect(filters).toContain('orderStatusId:ORDER_APPROVED');
    expect(filters).toContain('salesChannelEnumId:WEB_SALES_CHANNEL');
  });

  it('requests the item and ship-group facility fields used by queue filtering', () => {
    const fields = fieldsOf();
    expect(fields).toEqual(expect.arrayContaining([
      'orderItemSeqId',
      'shipGroupSeqId',
      'orderItemShipGroupIdentifier',
      'facilityId',
      'reservationFacilityId',
      'facilityTypeId',
      'facilityName',
      'orderFacilityId',
      'orderFacilityName'
    ]));
  });
});
