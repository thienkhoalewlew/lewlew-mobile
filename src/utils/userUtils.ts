import { User } from '../types';

// Cache to store user data
const userCache: Record<string, User> = {};

/**
 * Find a user by their ID from the local cache
 * @param userId The ID of the user to find
 * @returns The user object or undefined if not found
 */
export const findUserById = async (userId: string): Promise<User | undefined> => {
  // Only check the cache since we've removed API calls
  return userCache[userId];
};

/**
 * Synchronous version of findUserById that checks the cache
 * @param userId The ID of the user to find
 * @returns The cached user or undefined if not in cache
 */
export const findUserByIdSync = (userId: string): User | undefined => {
  return userCache[userId];
};

/**
 * Add a user to the cache
 * @param user The user object to add to cache
 */
export const addUserToCache = (user: User): void => {
  if (user && user.id) {
    userCache[user.id] = user;
  }
};

/**
 * Add multiple users to the cache
 * @param users Array of user objects to add to cache
 */
export const addUsersToCache = (users: User[]): void => {
  if (!users || !Array.isArray(users)) return;
  
  users.forEach(user => {
    if (user && user.id) {
      userCache[user.id] = user;
    }
  });
};

/**
 * Clear the user cache
 */
export const clearUserCache = (): void => {
  Object.keys(userCache).forEach(key => {
    delete userCache[key];
  });
};
