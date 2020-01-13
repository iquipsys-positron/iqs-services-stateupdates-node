import { DependencyResolver } from 'pip-services3-commons-node';
import { ExternalDependencies } from './ExternalDependencies';
export declare class ExternalDependenciesResolver extends DependencyResolver {
    private static _defaultConfig;
    constructor();
    resolve(): ExternalDependencies;
}
