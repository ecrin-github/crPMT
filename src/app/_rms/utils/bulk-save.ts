import { HttpResponse } from '@angular/common/http';
import { combineLatest, forkJoin, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

/** One item of a list to save with bulkSave$ */
export interface BulkSaveItem {
    payload: any;      // Data sent to the back-end, with its id for an existing item. null: the item can't be saved
    toSave: boolean;   // false for an unchanged existing item: it is not sent, its id is reused as is
}

/**
 * Saves the items of a list with at most 2 queries, one bulk create for the new items and one bulk update for the
 * changed ones, instead of one query per item (#125).
 *
 * Returns the id of each item, in the same order as the list, so that the caller can then save their sub-items.
 * The id is null if the item could not be saved.
 */
export function bulkSave$(
    items: BulkSaveItem[],
    create$: (payloads: any[]) => Observable<HttpResponse<any>>,
    update$: (payloads: any[]) => Observable<HttpResponse<any>>,
): Observable<Array<number | null>> {
    // Existing items start with their own id, new items get theirs from the bulk create response
    const ids: Array<number | null> = items.map((item) => item.payload?.id ?? null);

    // Positions in the list of the items to create and to update
    const indexes = items.map((_, i) => i);
    const addIndexes = indexes.filter((i) => items[i].payload && !items[i].payload.id);
    const editIndexes = indexes.filter((i) => items[i].payload?.id && items[i].toSave);

    const queries$: Observable<void>[] = [];

    if (addIndexes.length > 0) {
        queries$.push(create$(addIndexes.map((i) => items[i].payload)).pipe(
            // The back-end answers with the created items in the same order as the payload
            map((res) => addIndexes.forEach((i, j) => ids[i] = res.status === 201 ? res.body[j]?.id ?? null : null)),
            catchError(() => of(addIndexes.forEach((i) => ids[i] = null)))
        ));
    }

    if (editIndexes.length > 0) {
        queries$.push(update$(editIndexes.map((i) => items[i].payload)).pipe(
            map((res) => {
                if (res.status !== 200) {
                    editIndexes.forEach((i) => ids[i] = null);
                }
            }),
            catchError(() => of(editIndexes.forEach((i) => ids[i] = null)))
        ));
    }

    // forkJoin waits for every query to finish, but never emits for an empty array: nothing to send, ids are ready
    if (queries$.length === 0) {
        return of(ids);
    }
    return forkJoin(queries$).pipe(map(() => ids));
}

/**
 * Emits true once every observable has emitted true, false if one of them emitted false.
 * Unlike combineLatest alone, also emits (true) for an empty array instead of never emitting.
 */
export function allTrue$(obs$: Observable<boolean>[]): Observable<boolean> {
    if (obs$.length === 0) {
        return of(true);
    }
    return combineLatest(obs$).pipe(map((results: boolean[]) => results.every((r) => r)));
}
