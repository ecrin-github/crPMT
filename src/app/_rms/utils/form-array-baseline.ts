/**
 * Remembers the items of a list as they were loaded from the back-end, so that only the items
 * that changed are sent on save instead of all of them (#125).
 *
 * An item is considered changed if:
 * - it is new (no id),
 * - its value changed, whether by the user or programmatically (e.g. synced N/A fields),
 * - its position changed (the position is saved as the item order).
 *
 * Comparing values rather than relying on the "dirty" flag means a mistake can only cause an
 * unnecessary query, never a change that is not saved.
 */
export class FormArrayBaseline {
    private snapshots = new Map<string, { index: number, item: any }>();

    /** To call right after the list has been filled with the data loaded from the back-end */
    capture(items: any[]): void {
        this.snapshots.clear();
        (items || []).forEach((item, index) => {
            if (item?.id) {
                this.snapshots.set(String(item.id), { index, item: JSON.parse(JSON.stringify(item)) });
            }
        });
    }

    /** True if the item at this position must be saved */
    hasChanged(item: any, index: number): boolean {
        const snapshot = item?.id ? this.snapshots.get(String(item.id)) : null;
        if (!snapshot) {
            return true;
        }
        return snapshot.index !== index || JSON.stringify(snapshot.item) !== JSON.stringify(item);
    }

    /** True if this field of the item changed since it was loaded */
    hasFieldChanged(item: any, field: string): boolean {
        const snapshot = item?.id ? this.snapshots.get(String(item.id)) : null;
        if (!snapshot) {
            return true;
        }
        return JSON.stringify(snapshot.item[field]) !== JSON.stringify(item[field]);
    }
}
