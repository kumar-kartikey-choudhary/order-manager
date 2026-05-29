import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';

describe('order detail actions', () => {
  it('uses Ionic action surfaces instead of browser prompts', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/views/OrderDetail.vue'), 'utf8');

    expect(source).toContain('actionSheetController');
    expect(source).toContain('alertController');
    expect(source).toContain('legacySalesOrderActions');
    expect(source).not.toContain('window.prompt');
  });

  it('surfaces supported actions near their matching order sections', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/views/OrderDetail.vue'), 'utf8');

    expect(source).toContain('openOrderActions');
    expect(source).toContain('openItemActions');
    expect(source).toContain('openShipGroupActions');
    expect(source).toContain('openCommunicationActions');
    expect(source).toContain('openShipmentDocumentActions');
  });

  it('groups shipping information into ship group cards with their items', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/views/OrderDetail.vue'), 'utf8');

    expect(source).toContain('v-for="shipGroup in order.shipGroups"');
    expect(source).toContain('shipGroupDetails(shipGroup)');
    expect(source).toContain('shipGroupItems(shipGroup)');
    expect(source).toContain('Shipping instructions');
    expect(source).toContain('Facility');
  });
});
