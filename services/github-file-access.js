
const axios = require('axios');
const { log, error, warn, info } = require('../utils/logger');

const GITHUB_API_BASE_URL = 'https://api.github.com';

// GitHub authentication handling with fallback
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

if (!GITHUB_TOKEN) {
  warn('GITHUB_TOKEN environment variable not set. API requests will be rate-limited.');
}

const axiosInstance = axios.create({
  baseURL: GITHUB_API_BASE_URL,
  timeout: 10000, // 10 second timeout
  headers: {
    ...(GITHUB_TOKEN && { Authorization: `Bearer ${GITHUB_TOKEN}` }),
    'Content-Type': 'application/json',
    'User-Agent': 'Aixtiv-Integration-Gateway/1.0.1'
  }
});

// Request interceptor for logging
axiosInstance.interceptors.request.use(
  (config) => {
    info(`Making GitHub API request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    error('Request interceptor error:', error.message);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => {
    // Log rate limit information
    const remaining = response.headers['x-ratelimit-remaining'];
    const reset = response.headers['x-ratelimit-reset'];
    if (remaining && parseInt(remaining) < 100) {
      warn(`GitHub API rate limit warning: ${remaining} requests remaining. Reset at ${new Date(parseInt(reset) * 1000)}`);
    }
    return response;
  },
  (error) => {
    if (error.response) {
      const { status, statusText, data } = error.response;
      error(`GitHub API error: ${status} ${statusText}`, { data });
      
      // Handle specific GitHub API errors
      switch (status) {
        case 401:
          throw new Error('GitHub authentication failed. Check GITHUB_TOKEN.');
        case 403:
          if (data.message && data.message.includes('rate limit')) {
            throw new Error('GitHub API rate limit exceeded. Please try again later.');
          }
          throw new Error('GitHub API access forbidden.');
        case 404:
          throw new Error('Repository, branch, or file not found.');
        default:
          throw new Error(`GitHub API error: ${status} ${statusText}`);
      }
    } else if (error.request) {
      error('No response received from GitHub API:', error.message);
      throw new Error('Failed to connect to GitHub API. Please check your network connection.');
    } else {
      error('Request setup error:', error.message);
      throw error;
    }
  }
);

/**
 * Validates input parameters
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} path - File/directory path
 */
function validateParams(owner, repo, path) {
  if (!owner || !repo) {
    throw new Error('Owner and repository name are required');
  }
  if (path === undefined || path === null) {
    throw new Error('Path parameter is required');
  }
}

/**
 * Lists the contents of a repository path.
 *
 * @param {string} owner - The repository owner.
 * @param {string} repo - The repository name.
 * @param {string} path - The content path (can be empty string for root).
 * @param {string} [branch] - The branch name or commit SHA.
 * @returns {Promise<any>} The repository contents.
 */
async function listRepoContents(owner, repo, path = '', branch) {
  validateParams(owner, repo, path);
  
  const queryParams = new URLSearchParams();
  if (branch) {
    queryParams.append('ref', branch);
  }
  
  const url = `/repos/${owner}/${repo}/contents/${path}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  
  log(`Fetching repository contents`, { owner, repo, path, branch });
  
  try {
    const response = await axiosInstance.get(url);
    info(`Successfully retrieved ${Array.isArray(response.data) ? response.data.length : 1} items from ${owner}/${repo}/${path}`);
    return response.data;
  } catch (err) {
    error('Error listing repository contents', { owner, repo, path, branch, error: err.message });
    throw err;
  }
}

/**
 * Retrieves a file from a repository with both raw content and metadata options.
 *
 * @param {string} owner - The repository owner.
 * @param {string} repo - The repository name.
 * @param {string} path - The file path.
 * @param {string} [branch] - The branch name or commit SHA.
 * @param {boolean} [raw=true] - Whether to return raw content or metadata.
 * @returns {Promise<any>} The file content or metadata.
 */
async function getFile(owner, repo, path, branch, raw = true) {
  validateParams(owner, repo, path);
  
  const queryParams = new URLSearchParams();
  if (branch) {
    queryParams.append('ref', branch);
  }
  
  const url = `/repos/${owner}/${repo}/contents/${path}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  
  log(`Fetching file`, { owner, repo, path, branch, raw });
  
  try {
    const config = {
      headers: raw ? { Accept: 'application/vnd.github.v3.raw' } : {}
    };
    
    const response = await axiosInstance.get(url, config);
    info(`Successfully retrieved file ${path} from ${owner}/${repo}`);
    return response.data;
  } catch (err) {
    error('Error retrieving file', { owner, repo, path, branch, raw, error: err.message });
    throw err;
  }
}

/**
 * Searches for files in a repository using GitHub's search API.
 *
 * @param {string} owner - The repository owner.
 * @param {string} repo - The repository name.
 * @param {string} query - The search query.
 * @param {object} [options] - Additional search options.
 * @param {string} [options.extension] - File extension filter.
 * @param {string} [options.filename] - Filename pattern.
 * @param {number} [options.per_page=30] - Results per page (max 100).
 * @param {number} [options.page=1] - Page number.
 * @returns {Promise<any>} The search results.
 */
async function searchFiles(owner, repo, query, options = {}) {
  validateParams(owner, repo, query);
  
  if (!query.trim()) {
    throw new Error('Search query cannot be empty');
  }
  
  let searchQuery = `${query} repo:${owner}/${repo}`;
  
  // Add additional filters
  if (options.extension) {
    searchQuery += ` extension:${options.extension}`;
  }
  if (options.filename) {
    searchQuery += ` filename:${options.filename}`;
  }
  
  const queryParams = new URLSearchParams({
    q: searchQuery,
    per_page: Math.min(options.per_page || 30, 100),
    page: options.page || 1
  });
  
  const url = `/search/code?${queryParams.toString()}`;
  
  log(`Searching for files`, { owner, repo, query, options });
  
  try {
    const response = await axiosInstance.get(url);
    info(`Search completed: found ${response.data.total_count} results for query "${query}" in ${owner}/${repo}`);
    return response.data;
  } catch (err) {
    error('Error searching files', { owner, repo, query, options, error: err.message });
    throw err;
  }
}

/**
 * Gets repository information including branches and default branch.
 *
 * @param {string} owner - The repository owner.
 * @param {string} repo - The repository name.
 * @returns {Promise<any>} Repository information.
 */
async function getRepoInfo(owner, repo) {
  validateParams(owner, repo, '');
  
  const url = `/repos/${owner}/${repo}`;
  
  log(`Fetching repository information`, { owner, repo });
  
  try {
    const response = await axiosInstance.get(url);
    info(`Successfully retrieved repository information for ${owner}/${repo}`);
    return {
      name: response.data.name,
      full_name: response.data.full_name,
      default_branch: response.data.default_branch,
      private: response.data.private,
      description: response.data.description,
      language: response.data.language,
      created_at: response.data.created_at,
      updated_at: response.data.updated_at
    };
  } catch (err) {
    error('Error retrieving repository information', { owner, repo, error: err.message });
    throw err;
  }
}

/**
 * Lists branches in a repository.
 *
 * @param {string} owner - The repository owner.
 * @param {string} repo - The repository name.
 * @returns {Promise<any>} List of branches.
 */
async function listBranches(owner, repo) {
  validateParams(owner, repo, '');
  
  const url = `/repos/${owner}/${repo}/branches`;
  
  log(`Fetching repository branches`, { owner, repo });
  
  try {
    const response = await axiosInstance.get(url);
    info(`Successfully retrieved ${response.data.length} branches for ${owner}/${repo}`);
    return response.data.map(branch => ({
      name: branch.name,
      commit: {
        sha: branch.commit.sha,
        url: branch.commit.url
      },
      protected: branch.protected
    }));
  } catch (err) {
    error('Error listing repository branches', { owner, repo, error: err.message });
    throw err;
  }
}

module.exports = {
  listRepoContents,
  getFile,
  searchFiles,
  getRepoInfo,
  listBranches
};

