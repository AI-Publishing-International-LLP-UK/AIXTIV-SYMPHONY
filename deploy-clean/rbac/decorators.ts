/**
 * RBAC Decorators for Method-Level Authorization
 * © 2025 AI Publishing International LLP
 */

import { AuthorizeOptions } from './types';
import { rbacService } from './services/rbac-service';
import { extractUserContextFromRequest } from './utils/rbac-utils';

/**
 * Method decorator for authorization
 * @param options - Authorization options
 */
export function Authorize(options: AuthorizeOptions) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // Check if first argument is an HTTP request-like object
      const req = args[0];
      if (req && (req.headers || req.user)) {
        const userContext = extractUserContextFromRequest(req);
        
        if (!userContext) {
          throw new Error('Authentication required');
        }

        const isAuthorized = await rbacService.isAuthorized(userContext, options);
        
        if (!isAuthorized) {
          throw new Error('Forbidden: Insufficient permissions');
        }
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * Class decorator to apply authorization to all methods
 * @param options - Authorization options
 */
export function AuthorizeClass(options: AuthorizeOptions) {
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    return class extends constructor {
      constructor(...args: any[]) {
        super(...args);
        
        // Apply authorization to all methods
        const prototype = constructor.prototype;
        const propertyNames = Object.getOwnPropertyNames(prototype);
        
        propertyNames.forEach(name => {
          if (name !== 'constructor' && typeof prototype[name] === 'function') {
            const originalMethod = prototype[name];
            
            prototype[name] = async function (...methodArgs: any[]) {
              const req = methodArgs[0];
              if (req && (req.headers || req.user)) {
                const userContext = extractUserContextFromRequest(req);
                
                if (!userContext) {
                  throw new Error('Authentication required');
                }

                const isAuthorized = await rbacService.isAuthorized(userContext, options);
                
                if (!isAuthorized) {
                  throw new Error('Forbidden: Insufficient permissions');
                }
              }

              return originalMethod.apply(this, methodArgs);
            };
          }
        });
      }
    };
  };
}
