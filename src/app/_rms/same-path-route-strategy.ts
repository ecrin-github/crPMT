import { RouteReuseStrategy, DetachedRouteHandle, ActivatedRouteSnapshot } from '@angular/router';

export class SamePathRouteReuseStrategy extends RouteReuseStrategy {
    shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
        const futurePath = future.routeConfig?.path;
        // Allows navigation between 2 pages of the same path (same component, different ids)
        if (future.params['id'] !== curr.params['id']) {
            return false;
        }

        return future.routeConfig === curr.routeConfig; // Default behavior
    }

    retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
        return null;
    }

    shouldDetach(route: ActivatedRouteSnapshot): boolean {
        return false;
    }

    shouldAttach(route: ActivatedRouteSnapshot): boolean {
        return false;
    }

    store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle | null): void {

    }
}