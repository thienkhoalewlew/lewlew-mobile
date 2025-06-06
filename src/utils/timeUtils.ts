/**
 * Utility functions for formatting time
 */

/**
 * Format time as "x hours ago", "x minutes ago", etc.
 * Optimized for posts that exist for only 24 hours
 */
export const formatTimeAgo = (date: Date | string): string => {
  const now = new Date();
  const postDate = new Date(date);
  const diffInMs = now.getTime() - postDate.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));

  // If the post is from the future (shouldn't happen), show "just now"
  if (diffInMs < 0) {
    return 'just now';
  }

  // Less than 1 minute
  if (diffInMinutes < 1) {
    return 'just now';
  }

  // Less than 60 minutes
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  // Less than 24 hours
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  // 24 hours or more (shouldn't happen for posts, but just in case)
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) {
    return '1 day ago';
  }
  return `${diffInDays} days ago`;
};

/**
 * Format time with more detailed information
 * Shows "X hours Y minutes ago" for more precision
 */
export const formatDetailedTimeAgo = (date: Date | string): string => {
  const now = new Date();
  const postDate = new Date(date);
  const diffInMs = now.getTime() - postDate.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));

  // If the post is from the future, show "just now"
  if (diffInMs < 0) {
    return 'just now';
  }

  // Less than 1 minute
  if (diffInMinutes < 1) {
    return 'just now';
  }

  // Less than 60 minutes
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
  }

  // Less than 24 hours - show hours and remaining minutes
  if (diffInHours < 24) {
    const remainingMinutes = diffInMinutes % 60;
    if (remainingMinutes === 0) {
      return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
    }
    return `${diffInHours}h ${remainingMinutes}m ago`;
  }

  // 24 hours or more
  return 'expired';
};

/**
 * Get remaining time until post expires (24h from creation)
 */
export const getTimeUntilExpiry = (date: Date | string): string => {
  const postDate = new Date(date);
  const expiryDate = new Date(postDate.getTime() + 24 * 60 * 60 * 1000); // 24 hours later
  const now = new Date();
  const diffInMs = expiryDate.getTime() - now.getTime();

  if (diffInMs <= 0) {
    return 'expired';
  }

  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));

  if (diffInHours > 0) {
    const remainingMinutes = diffInMinutes % 60;
    if (remainingMinutes === 0) {
      return `${diffInHours}h left`;
    }
    return `${diffInHours}h ${remainingMinutes}m left`;
  }

  return `${diffInMinutes}m left`;
};

/**
 * Check if a post is expired (more than 24 hours old)
 */
export const isPostExpired = (date: Date | string): boolean => {
  const postDate = new Date(date);
  const now = new Date();
  const diffInMs = now.getTime() - postDate.getTime();
  const diffInHours = diffInMs / (1000 * 60 * 60);
  
  return diffInHours >= 24;
};
