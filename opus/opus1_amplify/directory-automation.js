#!/usr/bin/env node

/**
 * directory-automation.js - A utility for automating directory operations
 * Version: 1.0.0
 * 
 * This script provides functionality for:
 * - Organizing files by type
 * - Renaming files
 * - Cleaning up directories
 * - Copying directory contents
 */

const fs = require('fs');
const path = require('path');
const util = require('util');

// Promisify fs functions
const readdir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);
const mkdir = util.promisify(fs.mkdir);
const copyFile = util.promisify(fs.copyFile);
const rename = util.promisify(fs.rename);
const access = util.promisify(fs.access);

/**
 * Determines the type of file based on its extension.
 * @param {string} filePath - Path to the file
 * @returns {string} Type of the file
 */
function getFileType(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  
  const typeMap = {
    // Image files
    image: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp', '.svg', '.ico', '.heic', '.raw'],
    
    // Document files
    document: [
      '.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt', '.tex', '.md', 
      '.xls', '.xlsx', '.csv', '.ods', '.ppt', '.pptx', '.odp', '.pages',
      '.numbers', '.key'
    ],
    
    // Audio files
    audio: [
      '.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a', '.wma', '.aiff',
      '.alac', '.mid', '.midi'
    ],
    
    // Video files
    video: [
      '.mp4', '.mov', '.avi', '.mkv', '.wmv', '.flv', '.webm', '.m4v',
      '.mpg', '.mpeg', '.3gp', '.ts'
    ],
    
    // Archive files
    archive: [
      '.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz', '.iso',
      '.dmg', '.tgz'
    ],
    
    // Code files
    code: [
      '.js', '.py', '.java', '.c', '.cpp', '.h', '.cs', '.php', '.html',
      '.css', '.scss', '.sass', '.less', '.json', '.xml', '.yaml', '.yml',
      '.rb', '.go', '.rs', '.ts', '.jsx', '.tsx', '.swift', '.kt', '.sql',
      '.sh', '.bash', '.ps1', '.bat', '.pl', '.lua'
    ],
    
    // Data files
    data: [
      '.json', '.xml', '.csv', '.sql', '.db', '.sqlite', '.mdb',
      '.accdb', '.dbf', '.dat', '.parquet', '.avro', '.proto'
    ],
    
    // Config files
    config: [
      '.ini', '.conf', '.cfg', '.config', '.properties', '.prop',
      '.toml', '.env', '.yml', '.yaml', '.json'
    ],
    
    // Font files
    font: [
      '.ttf', '.otf', '.woff', '.woff2', '.eot', '.fnt'
    ]
  };
  
  for (const [type, extensions] of Object.entries(typeMap)) {
    if (extensions.includes(extension)) {
      return type;
    }
  }
  
  return 'other';
}

/**
 * Parses command line arguments.
 * @param {string[]} args - Command line arguments
 * @returns {object} Parsed arguments
 */
function parseArgs(args) {
  const parsedArgs = {
    command: null,
    source: null,
    target: null,
    options: {
      dryRun: false,
      recursive: false,
      overwrite: false,
      verbose: false
    }
  };
  
  // Skip the first two arguments (node and script name)
  const commandArgs = args.slice(2);
  
  if (commandArgs.length === 0 || commandArgs[0] === '--help' || commandArgs[0] === '-h') {
    parsedArgs.command = 'help';
    return parsedArgs;
  }
  
  parsedArgs.command = commandArgs[0];
  
  for (let i = 1; i < commandArgs.length; i++) {
    const arg = commandArgs[i];
    
    if (arg.startsWith('--') || arg.startsWith('-')) {
      // This is an option
      switch (arg) {
        case '--dry-run':
        case '-d':
          parsedArgs.options.dryRun = true;
          break;
        case '--recursive':
        case '-r':
          parsedArgs.options.recursive = true;
          break;
        case '--overwrite':
        case '-o':
          parsedArgs.options.overwrite = true;
          break;
        case '--verbose':
        case '-v':
          parsedArgs.options.verbose = true;
          break;
      }
    } else {
      // This is a positional argument
      if (!parsedArgs.source) {
        parsedArgs.source = arg;
      } else if (!parsedArgs.target) {
        parsedArgs.target = arg;
      }
    }
  }
  
  return parsedArgs;
}

/**
 * Loads configuration from a config file.
 * @param {string} configPath - Path to the config file
 * @returns {object} Configuration object
 */
function loadConfig(configPath = './config.json') {
  try {
    const configData = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(configData);
  } catch (error) {
    console.error(`Error loading config: ${error.message}`);
    return {
      defaultSourceDir: '.',
      defaultTargetDir: './organized',
      typeDirectories: {
        image: 'images',
        document: 'documents',
        audio: 'audio',
        video: 'videos',
        archive: 'archives',
        code: 'code',
        data: 'data',
        config: 'config',
        font: 'fonts',
        other: 'other'
      }
    };
  }
}

/**
 * Prints help information.
 */
function printHelp() {
  console.log(`
Directory Automation Tool
-------------------------

Usage:
  node directory-automation.js [command] [source] [target] [options]

Commands:
  organize   Organize files by type
  rename     Rename files using a pattern
  clean      Clean up a directory by removing specified files
  copy       Copy directory contents from source to target
  help       Display this help information

Options:
  --dry-run, -d     Show what would happen without making changes
  --recursive, -r   Process directories recursively
  --overwrite, -o   Overwrite existing files
  --verbose, -v     Display detailed information

Examples:
  node directory-automation.js organize ./downloads ./organized
  node directory-automation.js copy ./source ./backup --recursive
  node directory-automation.js clean ./temp --dry-run
  `);
}

/**
 * Gets a list of files in a directory, optionally recursive.
 * @param {string} dirPath - Path to the directory
 * @param {boolean} recursive - Whether to get files recursively
 * @returns {Promise<string[]>} Array of file paths
 */
async function getFiles(dirPath, recursive = false) {
  const files = [];
  
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory() && recursive) {
        const subFiles = await getFiles(fullPath, true);
        files.push(...subFiles);
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dirPath}: ${error.message}`);
  }
  
  return files;
}

/**
 * Ensures a directory exists, creating it if necessary.
 * @param {string} dirPath - Path to the directory
 * @returns {Promise<boolean>} True if successful
 */
async function ensureDirectory(dirPath) {
  try {
    await access(dirPath, fs.constants.F_OK);
    return true;
  } catch {
    try {
      await mkdir(dirPath, { recursive: true });
      return true;
    } catch (error) {
      console.error(`Error creating directory ${dirPath}: ${error.message}`);
      return false;
    }
  }
}

/**
 * Organizes files in a directory by type.
 * @param {string} sourceDir - Source directory
 * @param {string} targetDir - Target directory
 * @param {object} options - Options for organizing
 * @returns {Promise<void>}
 */
async function organizeFiles(sourceDir, targetDir, options) {
  const config = loadConfig();
  const files = await getFiles(sourceDir, options.recursive);
  
  if (files.length === 0) {
    console.log(`No files found in ${sourceDir}`);
    return;
  }
  
  console.log(`Found ${files.length} files to organize`);
  
  for (const filePath of files) {
    const fileType = getFileType(filePath);
    const typeDir = path.join(targetDir, config.typeDirectories[fileType] || fileType);
    const fileName = path.basename(filePath);
    const targetPath = path.join(typeDir, fileName);
    
    if (options.verbose) {
      console.log(`File: ${filePath}`);
      console.log(`Type: ${fileType}`);
      console.log(`Target: ${targetPath}`);
    }
    
    if (!options.dryRun) {
      try {
        await ensureDirectory(typeDir);
        
        const targetExists = fs.existsSync(targetPath);
        if (targetExists && !options.overwrite) {
          console.log(`Skipping ${fileName} (already exists)`);
          continue;
        }
        
        await copyFile(filePath, targetPath);
        console.log(`Moved ${fileName} to ${config.typeDirectories[fileType] || fileType}`);
      } catch (error) {
        console.error(`Error processing ${filePath}: ${error.message}`);
      }
    } else {
      console.log(`Would move ${fileName} to ${config.typeDirectories[fileType] || fileType}`);
    }
  }
}

/**
 * Renames files in a directory using a pattern.
 * @param {string} sourceDir - Source directory
 * @param {string} pattern - Renaming pattern
 * @param {object} options - Options for renaming
 * @returns {Promise<void>}
 */
async function renameFiles(sourceDir, pattern, options) {
  const files = await getFiles(sourceDir, options.recursive);
  
  if (files.length === 0) {
    console.log(`No files found in ${sourceDir}`);
    return;
  }
  
  console.log(`Found ${files.length} files to rename`);
  
  for (let i = 0; i < files.length; i++) {
    const filePath = files[i];
    const dirPath = path.dirname(filePath);
    const extension = path.extname(filePath);
    const baseName = path.basename(filePath, extension);
    
    // Replace tokens in pattern
    let newName = pattern
      .replace('{index}', i + 1)
      .replace('{name}', baseName)
      .replace('{ext}', extension.substring(1));
    
    // Ensure the file has the correct extension
    if (!newName.endsWith(extension)) {
      newName += extension;
    }
    
    const newPath = path.join(dirPath, newName);
    
    if (options.verbose) {
      console.log(`Original: ${filePath}`);
      console.log(`New: ${newPath}`);
    }
    
    if (!options.dryRun) {
      try {
        const targetExists = fs.existsSync(newPath);
        if (targetExists && !options.overwrite) {
          console.log(`Skipping ${path.basename(filePath)} (target already exists)`);
          continue;
        }
        
        await rename(filePath, newPath);
        console.log(`Renamed ${path.basename(filePath)} to ${newName}`);
      } catch (error) {
        console.error(`Error renaming ${filePath}: ${error.message}`);
      }
    } else {
      console.log(`Would rename ${path.basename(filePath)} to ${newName}`);
    }
  }
}

/**
 * Cleans up a directory by removing specified file types.
 * @param {string} dirPath - Path to the directory
 * @param {string[]} patterns - File patterns to remove
 * @param {object} options - Options for cleaning
 * @returns {Promise<void>}
 */
async function cleanDirectory(dirPath, patterns = [], options) {
  const files = await getFiles(dirPath, options.recursive);
  
  if (files.length === 0) {
    console.log(`No files found in ${dirPath}`);
    return;
  }
  
  // If no patterns specified, use some common temp files
  if (patterns.length === 0) {
    patterns = [
      '.DS_Store',
      'Thumbs.db',
      '*.tmp',
      '*.bak',
      '*~',
      '._*'
    ];
  }
  
  const matchesAnyPattern = (filePath) => {
    const fileName = path.basename(filePath);
    return patterns.some(pattern => {
      if (pattern.includes('*')) {
        // Convert glob pattern to regex
        const regexPattern = pattern
          .replace(/\./g, '\\.')
          .replace(/\*/g, '.*');
        return new RegExp(`^${regexPattern}$`).test(fileName);
      } else {
        return fileName === pattern;
      }
    });
  };
  
  const filesToRemove = files.filter(matchesAnyPattern);
  
  console.log(`Found ${filesToRemove.length} files to clean up`);
  
  for (const filePath of filesToRemove) {
    if (options.verbose) {
      console.log(`File to remove: ${filePath}`);
    }
    
    if (!options.dryRun) {
      try {
        await fs.promises.unlink(filePath);
        console.log(`Removed ${path.basename(filePath)}`);
      } catch (error) {
        console.error(`Error removing ${filePath}: ${error.message}`);
      }
    } else {
      console.log(`Would remove ${path.basename(filePath)}`);
    }
  }
}

/**
 * Copies directory contents from source to target.
 * @param {string} sourceDir - Source directory
 * @param {string

#!/usr/bin/env node

/**
 * Directory Automation Tool
 * A utility for organizing files, renaming in batch, and other directory operations
 * Version: 1.0.0
 */

const fs = require('fs');
const path = require('path');
const util = require('util');
const readline = require('readline');

// Promisified versions of fs functions
const readdir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);
const mkdir = util.promisify(fs.mkdir);
const rename = util.promisify(fs.rename);
const copyFile = util.promisify(fs.copyFile);
const unlink = util.promisify(fs.unlink);

// Default config
const defaultConfig = {
  organizeTypes: true,
  createDateFolders: false,
  replaceSpaces: false,
  backupBeforeChanges: true,
  logOperations: true
};

// Global variables
let config = { ...defaultConfig };
let verbose = false;
let dryRun = false;

/**
 * Determines the type of a file based on its extension
 * @param {string} filename - The filename to check
 * @returns {string} The type of the file
 */
function getFileType(filename) {
  const extension = path.extname(filename).toLowerCase();
  
  // Define file type mappings
  const typeMap = {
    // Document files
    document: ['.doc', '.docx', '.pdf', '.txt', '.rtf', '.md', '.markdown', 
              '.odt', '.tex', '.wpd', '.pages', '.log', '.msg'],
    
    // Spreadsheet files
    spreadsheet: ['.xls', '.xlsx', '.csv', '.tsv', '.ods', '.numbers'],
    
    // Presentation files
    presentation: ['.ppt', '.pptx', '.key', '.odp', '.pps'],
    
    // Image files
    image: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.svg', '.webp', 
            '.ico', '.psd', '.ai', '.eps', '.raw', '.cr2', '.nef', '.heic'],
    
    // Audio files
    audio: ['.mp3', '.wav', '.aac', '.flac', '.ogg', '.m4a', '.wma', '.aiff',
            '.opus', '.m4b', '.mid', '.midi'],
    
    // Video files
    video: ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv', '.webm', '.m4v', 
            '.mpg', '.mpeg', '.3gp', '.ts', '.mts', '.m2ts'],
    
    // Archive files
    archive: ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz', '.iso', 
              '.dmg', '.tgz'],
    
    // Code files
    code: ['.js', '.py', '.java', '.c', '.cpp', '.cs', '.php', '.rb', '.go', 
           '.swift', '.kt', '.rs', '.ts', '.html', '.css', '.scss', '.jsx', 
           '.tsx', '.json', '.xml', '.yaml', '.yml', '.sh', '.bash', '.ps1', 
           '.bat', '.sql', '.r', '.h', '.hpp', '.m', '.mm', '.dart'],
    
    // Database files
    database: ['.db', '.sqlite', '.sqlite3', '.mdb', '.accdb', '.sql', '.bak'],
    
    // Font files
    font: ['.ttf', '.otf', '.woff', '.woff2', '.eot'],
    
    // Data files
    data: ['.dat', '.bin', '.pkl', '.parquet', '.avro', '.npy', '.h5', '.hdf5', '.npz'],
    
    // Config files
    config: ['.cfg', '.conf', '.ini', '.config', '.properties', '.env', '.toml']
  };
  
  // Check each category
  for (const [type, extensions] of Object.entries(typeMap)) {
    if (extensions.includes(extension)) {
      return type;
    }
  }
  
  // Return 'other' if no match is found
  return 'other';
}

/**
 * Parse command line arguments
 * @param {string[]} args - Command line arguments
 * @returns {Object} Parsed arguments
 */
function parseArgs(args) {
  const parsedArgs = {
    command: null,
    options: {},
    targets: []
  };

  // Remove 'node' and script name from args
  args = args.slice(2);

  if (args.length === 0) {
    printHelp();
    process.exit(0);
  }

  // Extract command
  parsedArgs.command = args[0];
  
  // Process remaining arguments
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    
    if (arg.startsWith('--')) {
      // Long form option
      const option = arg.slice(2);
      if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
        parsedArgs.options[option] = args[i + 1];
        i++;
      } else {
        parsedArgs.options[option] = true;
      }
    } else if (arg.startsWith('-')) {
      // Short form option
      const option = arg.slice(1);
      parsedArgs.options[option] = true;
    } else {
      // Target path
      parsedArgs.targets.push(arg);
    }
  }
  
  return parsedArgs;
}

/**
 * Print help information
 */
function printHelp() {
  console.log(`
Directory Automation Tool
Usage: node directory-automation.js [command] [options] [targets]

Commands:
  organize            Organize files by type
  rename              Batch rename files
  cleanup             Remove temporary and duplicate files
  archive             Create an archive of the directory
  backup              Create a backup of files
  stats               Display directory statistics

Options:
  --config [file]     Specify a config file to use
  --dry-run           Show what would be done without making changes
  --verbose           Display detailed information
  --help              Show this help message

Examples:
  node directory-automation.js organize ~/Downloads
  node directory-automation.js rename --pattern "img_*.jpg" --replace "vacation_*.jpg" ./photos
  node directory-automation.js cleanup --remove-empty ./old_projects
  `);
}

/**
 * Load configuration from file
 * @param {string} configPath - Path to the configuration file
 * @returns {Object} Loaded configuration
 */
async function loadConfig(configPath) {
  try {
    if (!configPath) return { ...defaultConfig };
    
    const configData = await fs.promises.readFile(configPath, 'utf8');
    const loadedConfig = JSON.parse(configData);
    
    // Merge with default config to ensure all properties exist
    return { ...defaultConfig, ...loadedConfig };
  } catch (error) {
    console.error(`Error loading config: ${error.message}`);
    return { ...defaultConfig };
  }
}

/**
 * Create a directory if it doesn't exist
 * @param {string} dirPath - Path to the directory
 */
async function ensureDir(dirPath) {
  try {
    await fs.promises.access(dirPath);
  } catch (error) {
    if (dryRun) {
      console.log(`Would create directory: ${dirPath}`);
      return;
    }
    try {
      await mkdir(dirPath, { recursive: true });
      if (verbose) console.log(`Created directory: ${dirPath}`);
    } catch (mkdirError) {
      console.error(`Error creating directory ${dirPath}: ${mkdirError.message}`);
    }
  }
}

/**
 * Organize files by type
 * @param {string} dirPath - Directory to organize
 */
async function organizeByType(dirPath) {
  try {
    if (verbose) console.log(`Organizing files in ${dirPath}`);
    
    const files = await readdir(dirPath);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      
      try {
        const fileStat = await stat(filePath);
        
        // Skip directories
        if (fileStat.isDirectory()) continue;
        
        // Get file type
        const fileType = getFileType(file);
        
        // Create type directory if it doesn't exist
        const typeDir = path.join(dirPath, fileType);
        await ensureDir(typeDir);
        
        // Move file to type directory
        const destinationPath = path.join(typeDir, file);
        
        if (dryRun) {
          console.log(`Would move ${filePath} to ${destinationPath}`);
        } else {
          await rename(filePath, destinationPath);
          if (verbose) console.log(`Moved ${file} to ${fileType}/ directory`);
        }
      } catch (error) {
        console.error(`Error processing file ${file}: ${error.message}`);
      }
    }
    
    console.log('Files organized successfully');
  } catch (error) {
    console.error(`Error organizing files: ${error.message}`);
  }
}

/**
 * Rename files in batch based on a pattern
 * @param {string} dirPath - Directory containing files to rename
 * @param {string} pattern - Glob pattern to match files
 * @param {string} replacePattern - Pattern to rename files with
 */
async function batchRename(dirPath, pattern, replacePattern) {
  try {
    if (verbose) console.log(`Renaming files in ${dirPath} matching ${pattern}`);
    
    const files = await readdir(dirPath);
    const matcher = new RegExp(pattern.replace(/\*/g, '(.*)'));
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      
      try {
        const fileStat = await stat(filePath);
        
        // Skip directories
        if (fileStat.isDirectory()) continue;
        
        // Check if file matches pattern
        const match = file.match(matcher);
        if (match) {
          // Create new filename
          let newName = replacePattern;
          for (let i = 1; i < match.length; i++) {
            newName = newName.replace(`*`, match[i]);
          }
          
          const newPath = path.join(dirPath, newName);
          
          if (dryRun) {
            console.log(`Would rename ${filePath} to ${newPath}`);
          } else {
            await rename(filePath, newPath);
            if (verbose) console.log(`Renamed ${file} to ${newName}`);
          }
        }
      } catch (error) {
        console.error(`Error processing file ${file}: ${error.message}`);
      }
    }
    
    console.log('Files renamed successfully');
  } catch (error) {
    console.error(`Error renaming files: ${error.message}`);
  }
}

/**
 * Clean up temporary and duplicate files
 * @param {string} dirPath - Directory to clean
 * @param {boolean} removeEmpty - Whether to remove empty directories
 */
async function cleanup(dirPath, removeEmpty) {
  try {
    if (verbose) console.log(`Cleaning up ${dirPath}`);
    
    const tempPatterns = [/\.tmp$/, /~$/, /^~.*/, /\.bak$/, /\.swp$/];
    const files = await readdir(dirPath);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      
      try {
        const fileStat = await stat(filePath);
        
        if (fileStat.isDirectory()) {
          // Recursively clean subdirectories
          await cleanup(filePath, removeEmpty);
          
          // Remove empty directory if specified
          if (removeEmpty) {
            const subFiles = await readdir(filePath);
            if (subFiles.length === 0) {
              if (dryRun) {
                console.log(`Would remove empty directory: ${filePath}`);
              } else {
                await fs.promises.rmdir(filePath);
                if (verbose) console.log(`Removed empty directory: ${filePath}`);
              }
            }
          }
        } else {
          // Check if file matches temp patterns
          const isTemp = tempPatterns.some(pattern => pattern.test(file));
          
          if (isTemp) {
            if (dryRun) {
              console.log(`Would remove temporary file: ${filePath}`);
            } else {
              await unlink(filePath);
              if (verbose) console.log(`Removed temporary file: ${filePath}`);
            }
          }
        }
      } catch (error) {
        console.error(`Error processing ${filePath}: ${error.message}`);
      }
    }
    
    console.log('Cleanup completed successfully');
  } catch (error) {
    console.error(`Error cleaning directory: ${error.message}`);
  }
}

/**
 * Create an archive of a directory
 * @param {string} dirPath - Directory to archive
 * @param {string} outputPath - Path to save the archive
 */
async function archiveDirectory(dirPath, outputPath) {
  try {
    console.log(`Archiving ${dirPath} is not implemented yet. Use a system archiving tool.`);
    // This would typically use a library like archiver, tar, or similar
    // Implementation details would depend on requirements
  } catch (error) {
    console.error(`Error archiving directory: ${error.message}`);
  }
}

/**
 * Create a backup of files
 * @param {string} dirPath - Directory to backup
 * @param {string} backupPath - Path to save the backup
 */
async function backupDirectory(dirPath, backupPath) {
  try {
    if (!backupPath) {
      const timestamp = new Date().toISOString().replace(/[:\.]/g, '-');
      backupPath = `${dirPath}_backup_${timestamp}`;
    }
    
    if (verbose) console.log(`Backing up ${dirPath} to ${backupPath}`);
    
    await ensureDir(backupPath);
    
    // Copy all files from source to backup
    await copyDirectoryContents(dirPath, backupPath);
    
    console.log(`Backup created successfully at ${backupPath}`);
  } catch (error) {
    console.error(`Error creating backup: ${error.message}`);
  }
}

/**
 * Copy contents of a directory to another
 * @param {string} sourceDir - Source directory
 * @param {string} targetDir - Target directory
 */
async function copyDirectoryContents(sourceDir, targetDir) {
  try {
    const files = await readdir(sourceDir);
    
    for (const file of files) {
      const sourcePath = path.join(sourceDir, file);
      const targetPath = path.join(targetDir, file);
      
      const fileStat = await stat(sourcePath);
      
      if (fileStat.isDirectory()) {
        // Create directory in target and copy contents
        await ensureDir(targetPath);
        await copyDirectoryContents(sourcePath, targetP/**
 * Parse command line arguments
 * @returns {Object} Parsed arguments
 */
function parseArgs() {
  const args = {};
  
  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];
    
    if (arg.startsWith('--')) {
      const option = arg.slice(2);
      
      if (i + 1 < process.argv.length && !process.argv[i + 1].startsWith('--')) {
        args[option] = process.argv[i + 1];
        i++;
      } else {
        args[option] = true;
      }
    }
  }
  
  return args;
}

/**
 * Print help information
 */
function printHelp() {
  console.log(`
Directory Automation Tool

Usage:
  node directory-automation.js --operation <operation> [options]

Operations:
  organize    Organize files by type, date, or size
  rename      Rename files based on a pattern
  move        Move files based on criteria
  
Common Options:
  --target        Target directory for operations
  --source        Source directory for move operations
  --destination   Destination directory for move operations
  --by            Organization method (type, date, size)
  --recursive     Process directories recursively
  --dry-run       Show what would be done without making changes
  --verbose       Display detailed information
  --help          Show this help information

Examples:
  node directory-automation.js --operation organize --target ./my-files --by type
  node directory-automation.js --operation rename --target ./photos --pattern "IMG_(.*)_" --replacement "Photo-$1-"
  `);
}

/**
 * Load configuration from file or use defaults
 * @param {string} configPath Path to config file
 * @param {string} operation Current operation
 * @returns {Object} Configuration object
 */
async function loadConfig(configPath, operation) {
  const defaultConfig = {
    organize: {
      by: 'type',
      createDirs: true,
      includeHidden: false
    },
    rename: {
      pattern: '',
      replacement: '',
      recursive: false
    },
    move: {
      pattern: '*',
      createDirs: true
    }
  };
  
  if (!configPath) {
    return defaultConfig;
  }
  
  try {
    const configContent = await fs.promises.readFile(configPath, 'utf8');
    const userConfig = JSON.parse(configContent);
    
    return {
      ...defaultConfig,
      ...userConfig
    };
  } catch (error) {
    console.warn(`Warning: Could not load config file: ${error.message}`);
    return defaultConfig;
  }
}

// Promisify fs functions
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const mkdir = promisify(fs.mkdir);
const rename = promisify(fs.rename);

/**
 * Parse command line arguments
 * @returns {Object} Parsed arguments
 */
function parseArgs() {
  const args = {};
  
  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];
    
    if (arg.startsWith('--')) {
      const option = arg.slice(2);
      
      if (i + 1 < process.argv.length && !process.argv[i + 1].startsWith('--')) {
        args[option] = process.argv[i + 1];
        i++;
      } else {
        args[option] = true;
      }
    }
  }
  
  return args;
}

/**
 * Print help information
 */
function printHelp() {
  console.log(`
Directory Automation Tool

Usage:
  node directory-automation.js --operation <operation> [options]

Operations:
  organize    Organize files by type, date, or size
  rename      Rename files based on a pattern
  move        Move files based on criteria
  
Common Options:
  --target        Target directory for operations
  --source        Source directory for move operations
  --destination   Destination directory for move operations
  --by            Organization method (type, date, size)
  --recursive     Process directories recursively
  --dry-run       Show what would be done without making changes
  --verbose       Display detailed information
  --help          Show this help information

Examples:
  node directory-automation.js --operation organize --target ./my-files --by type
  node directory-automation.js --operation rename --target ./photos --pattern "IMG_(.*)_" --replacement "Photo-$1-"
  `);
}

/**
 * Load configuration from file or use defaults
 * @param {string} configPath Path to config file
 * @param {string} operation Current operation
 * @returns {Object} Configuration object
 */
async function loadConfig(configPath, operation) {
  const defaultConfig = {
    organize: {
      by: 'type',
      createDirs: true,
      includeHidden: false
    },
    rename: {
      pattern: '',
      replacement: '',
      recursive: false
    },
    move: {
      pattern: '*',
      createDirs: true
    }
  };
  
  if (!configPath) {
    return defaultConfig;
  }
  
  try {
    const configContent = await fs.promises.readFile(configPath, 'utf8');
    const userConfig = JSON.parse(configContent);
    
    return {
      ...defaultConfig,
      ...userConfig
    };
  } catch (error) {
    console.warn(`Warning: Could not load config file: ${error.message}`);
    return defaultConfig;
  }
}

// Promisify fs functions
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const mkdir = promisify(fs.mkdir);
const rename = promisify(fs.rename);

/**
 * Parse command line arguments
 * @returns {Object} Parsed arguments
 */
function parseArgs() {
  const args = {};
  
  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];
    
    if (arg.startsWith('--')) {
      const option = arg.slice(2);
      
      if (i + 1 < process.argv.length && !process.argv[i + 1].startsWith('--')) {
        args[option] = process.argv[i + 1];
        i++;
      } else {
        args[option] = true;
      }
    }
  }
  
  return args;
}

/**
 * Print help information
 */
function printHelp() {
  console.log(`
Directory Automation Tool

Usage:
  node directory-automation.js --operation <operation> [options]

Operations:
  organize    Organize files by type, date, or size
  rename      Rename files based on a pattern
  move        Move files based on criteria
  
Common Options:
  --target        Target directory for operations
  --source        Source directory for move operations
  --destination   Destination directory for move operations
  --by            Organization method (type, date, size)
  --recursive     Process directories recursively
  --dry-run       Show what would be done without making changes
  --verbose       Display detailed information
  --help          Show this help information

Examples:
  node directory-automation.js --operation organize --target ./my-files --by type
  node directory-automation.js --operation rename --target ./photos --pattern "IMG_(.*)_" --replacement "Photo-$1-"
  `);
}

/**
 * Load configuration from file or use defaults
 * @param {string} configPath Path to config file
 * @param {string} operation Current operation
 * @returns {Object} Configuration object
 */
async function loadConfig(configPath, operation) {
  const defaultConfig = {
    organize: {
      by: 'type',
      createDirs: true,
      includeHidden: false
    },
    rename: {
      pattern: '',
      replacement: '',
      recursive: false
    },
    move: {
      pattern: '*',
      createDirs: true
    }
  };
  
  if (!configPath) {
    return defaultConfig;
  }
  
  try {
    const configContent = await fs.promises.readFile(configPath, 'utf8');
    const userConfig = JSON.parse(configContent);
    
    return {
      ...defaultConfig,
      ...userConfig
    };
  } catch (error) {
    console.warn(`Warning: Could not load config file: ${error.message}`);
    return defaultConfig;
  }
}
ire('fs');
const path = require('path');
const { promisify } = require('util');
const { promisify } = require('util');
const glob = require('glob');

// Convert callback-based functions to Promise-based
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const rename = promisify(fs.rename);
const mkdir = promisify(fs.mkdir);
const copyFile = promisify(fs.copyFile);
const unlink = promisify(fs.unlink);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// Default configuration options
const DEFAULT_CONFIG = {
  rename: {
    replaceSpaces: true,
    spacesReplacement: '-',
    toLowerCase: true,
    toUpperCase: false,
    capitalizeWords: false,
    removeSpecialChars: true,
    specialCharsReplacement: '',
    prefixDirectories: false,
    prefix: '',
    suffixDirectories: false,
    suffix: '',
    removePrefix: '',
    removeSuffix: ''
  },
  move: {
    overwrite: false,
    createMissingDirectories: true,
    preserveTimestamps: true,
    includeHidden: false,
    followSymlinks: false
  },
  organize: {
    by: 'type', // can be 'type', 'date', 'size', 'name', 'extension'
    includeHidden: false,
    preserveDirectoryStructure: false,
    dateFolderFormat: 'YYYY-MM', // for organizing by date
    sizeCategories: {
      tiny: '0-10KB',
      small: '10KB-1MB',
      medium: '1MB-100MB',
      large: '100MB-1GB',
      huge: '1GB+'
    }
  }
};

/**
 * Parse command line arguments
 * @returns {Object} Parsed arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const parsedArgs = {
    operation: null,
    target: null,
    source: null,
    destination: null,
    pattern: null,
    config: null,
    by: null,
    dryRun: false,
    recursive: false,
    verbose: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--operation':
      case '-o':
        parsedArgs.operation = args[++i];
        break;
      case '--target':
      case '-t':
        parsedArgs.target = args[++i];
        break;
      case '--source':
      case '-s':
        parsedArgs.source = args[++i];
        break;
      case '--destination':
      case '-d':
        parsedArgs.destination = args[++i];
        break;
      case '--pattern':
      case '-p':
        parsedArgs.pattern = args[++i];
        break;
      case '--config':
      case '-c':
        parsedArgs.config = args[++i];
        break;
      case '--by':
      case '-b':
        parsedArgs.by = args[++i];
        break;
      case '--dry-run':
        parsedArgs.dryRun = true;
        break;
      case '--recursive':
      case '-r':
        parsedArgs.recursive = true;
        break;
      case '--verbose':
      case '-v':
        parsedArgs.verbose = true;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
        break;
    }
  }

  return parsedArgs;
}

/**
 * Print help information
 */
function printHelp() {
  console.log(`
Directory Automation Tool
========================

Usage: node directory-automation.js [options]

Operations:
  --operation, -o    Operation to perform: rename, move, organize, or copy

Common Options:
  --target, -t       Target directory for operations
  --source, -s       Source directory for move and copy operations
  --destination, -d  Destination directory for move and copy operations
  --pattern, -p      File/directory pattern (glob patterns supported)
  --config, -c       Path to JSON configuration file
  --dry-run          Show what would happen without making changes
  --recursive, -r    Process directories recursively
  --verbose, -v      Print detailed information during execution
  --help, -h         Show this help message

Rename-specific Options:
  --replace-spaces   Replace spaces in names (default: true)
  --spaces-with      Character(s) to replace spaces with (default: -)
  --case             Case transformation: lower, upper, capital, none

Organize-specific Options:
  --by, -b           Organize by: type, date, size, name, extension

Examples:
  node directory-automation.js --operation rename --target ./my-dir --replace-spaces --spaces-with _
  node directory-automation.js --operation move --source ./src --destination ./dest --pattern "*.js"
  node directory-automation.js --operation organize --target ./files --by type
  `);
}

/**
 * Load configuration from file or use defaults
 * @param {string} configPath Path to configuration file
 * @param {string} operation Operation being performed
 * @returns {Promise<Object>} Configuration object
 */
async function loadConfig(configPath, operation) {
  let config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  
  if (configPath) {
    try {
      const configContent = await readFile(configPath, 'utf8');
      const userConfig = JSON.parse(configContent);
      
      // Merge user config with defaults for the specific operation
      if (userConfig[operation]) {
        config[operation] = { ...config[operation], ...userConfig[operation] };
      }
      
      // Merge global settings if they exist
      if (userConfig.global) {
        config.global = userConfig.global;
      }
    } catch (error) {
      console.error(`Error loading configuration file: ${error.message}`);
      process.exit(1);
    }
  }
  
  return config;
}

/**
 * Transform a filename according to rename configuration
 * @param {string} name Original name
 * @param {Object} config Rename configuration
 * @returns {string} Transformed name
 */
function transformName(name, config) {
  let newName = name;
  
  // Remove extension to transform only the filename part
  const ext = path.extname(newName);
  let baseName = path.basename(newName, ext);
  
  // Remove prefix if specified
  if (config.removePrefix && baseName.startsWith(config.removePrefix)) {
    baseName = baseName.substring(config.removePrefix.length);
  }
  
  // Remove suffix if specified
  if (config.removeSuffix && baseName.endsWith(config.removeSuffix)) {
    baseName = baseName.substring(0, baseName.length - config.removeSuffix.length);
  }
  
  // Replace spaces if configured
  if (config.replaceSpaces) {
    baseName = baseName.replace(/\s+/g, config.spacesReplacement);
  }
  
  // Apply case transformations
  if (config.toLowerCase) {
    baseName = baseName.toLowerCase();
  } else if (config.toUpperCase) {
    baseName = baseName.toUpperCase();
  } else if (config.capitalizeWords) {
    baseName = baseName.replace(/\b\w/g, c => c.toUpperCase());
  }
  
  // Remove special characters if configured
  if (config.removeSpecialChars) {
    baseName = baseName.replace(/[^\w\s-]/g, config.specialCharsReplacement);
  }
  
  // Add prefix if specified
  if (config.prefixDirectories) {
    baseName = config.prefix + baseName;
  }
  
  // Add suffix if specified
  if (config.suffixDirectories) {
    baseName = baseName + config.suffix;
  }
  
  // Recombine with extension
  return baseName + ext;
}

/**
 * Recursively rename files and directories
 * @param {string} directory Directory to process
 * @param {Object} config Rename configuration
 * @param {Object} options Additional options
 * @returns {Promise<Array>} List of renamed items
 */
async function renameItems(directory, config, options) {
  const { dryRun, recursive, verbose } = options;
  const renamedItems = [];
  
  try {
    const items = await readdir(directory);
    
    for (const item of items) {
      const itemPath = path.join(directory, item);
      const itemStat = await stat(itemPath);
      
      // Skip hidden files unless configured to include them
      if (item.startsWith('.') && !config.includeHidden) {
        continue;
      }
      
      const newName = transformName(item, config);
      
      if (newName !== item) {
        const newPath = path.join(directory, newName);
        
        if (!dryRun) {
          await rename(itemPath, newPath);
        }
        
        renamedItems.push({ from: itemPath, to: newPath });
        
        if (verbose) {
          console.log(`Renamed: ${itemPath} → ${newPath}`);
        }
      }
      
      // Process subdirectories recursively if configured
      if (recursive && itemStat.isDirectory()) {
        const newDirectoryPath = newName !== item 
          ? path.join(directory, newName) 
          : itemPath;
          
        const nestedRenamedItems = await renameItems(newDirectoryPath, config, options);
        renamedItems.push(...nestedRenamedItems);
      }
    }
    
    return renamedItems;
  } catch (error) {
    console.error(`Error renaming items in ${directory}: ${error.message}`);
    return renamedItems;
  }
}

/**
 * Move files and directories based on pattern
 * @param {string} source Source directory
 * @param {string} destination Destination directory
 * @param {string} pattern File pattern (glob pattern)
 * @param {Object} config Move configuration
 * @param {Object} options Additional options
 * @returns {Promise<Array>} List of moved items
 */
async function moveItems(source, destination, pattern, config, options) {
  const { dryRun, verbose } = options;
  const movedItems = [];
  
  try {
    // Ensure destination directory exists
    if (config.createMissingDirectories && !dryRun) {
      await mkdir(destination, { recursive: true }).catch(() => {});
    }
    
    // Find files matching the pattern
    const files = await promisify(glob)(pattern, {
      cwd: source,
      absolute: false,
      dot: config.includeHidden,
      follow: config.followSymlinks
    });
    
    for (const file of files) {
      const sourcePath = path.join(source, file);
      const destPath = path.join(destination, file);
      const destDir = path.dirname(destPath);
      
      // Create target directory if needed
      if (config.createMissingDirectories && !dryRun) {
        await mkdir(destDir, { recursive: true }).catch(() => {});
      }
      
      // Check if destination already exists
      try {
        await stat(destPath);
        
        if (!config.overwrite) {
          if (verbose) {
            console.log(`Skipping: ${sourcePath} (destination already exists)`);
          }
          continue;
        }
      } catch (error) {
        // File doesn't exist, we can proceed
      }
      
      if (!dryRun) {
        await rename(sourcePath, destPath);
      }
      
      movedItems.push({ from: sourcePath, to: destPath });
      
      if (verbose) {
        console.log(`Moved: ${sourcePath} → ${destPath}`);
      }
    }
    
    return movedItems;
  } catch (error) {
    console.error(`Error moving items: ${error.message}`);
    return movedItems;
  }
}

/**
 * Get the type of a file based on its extension
 * @param {string} filename Filename
 * @returns {string} File type category
 */
function getFileType(filename) {
  const ext = path.extname(filename).toLowerCase();
  
  const typeMap = {
    // Images
    '.jpg': 'images',
    '.jpeg': 'images',
    '.png': 'images',
    '.gif': 'images',
    '.svg': 'images',
    '.webp': 'images',
    '.bmp': 'images',
    '.tiff': 'images',
    
    // Documents
    '.pdf': 'documents',
    '.doc': 'documents',
    '.docx': 'documents',
    '.txt': 'documents',
    '.rtf': 'documents',
    '.md': 'documents',
    '.odt': 'documents',
    
    // Spreadsheets
    '.xls': 'spreadsheets',
    '.xlsx': 'spreadsheets',
    '.csv': 'spreadsheets',
    '.ods': 'spreadsheets',
    
    // Presentations
    '.ppt': 'presentations',
    '.pptx': 'presentations',
    '.odp': 'presentations',
    
    // Audio
    '.mp3': 'audio',
    '.wav': 'audio',
    '.ogg': 'audio',
    '.flac': 'audio',
    '.aac': 'audio',
    '.m4a': 'audio',
    
    // Video
    '.mp4': 'videos',
    '.mkv': 'videos',
    '.mov': 'videos',
    '.avi': 'videos',
    '.wmv': 'videos',
    '.webm': 'videos',
    '.flv': 'videos',
    
    // Archives
    '.zip': 'archives',
    '.rar': 'archives',
    '.tar': 'archives',
    '.gz': 'archives',
    '.7z': 'archives',
    
    // Code
    '.js': 'code',
    '.rb': 'code',
    '.rs': 'code',
    '.swift': 'code',
    
    // Data
    '.csv': 'data',
    '.json': 'data',
    '.xml': 'data',
    '.sql': 'data',
    '.db': 'data',
    '.sqlite': 'data',
    
    // Config
    '.env': 'config',
    '.ini': 'config',
    '.cfg': 'config',
    '.yml': 'config',
    '.yaml': 'config',
    '.toml': 'config',
    
    // Font
    '.ttf': 'fonts',
    '.otf': 'fonts',
    '.eot': 'fonts'
  };

  return typeMap[ext] || 'other';
}

/**
 * Main function to process command line arguments and execute operations
 */
async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const options = {
    dryRun: false,
    recursive: false,
    verbose: false
  };
  
  // Simple argument parsing
  let operation = null;
  let sourceDir = null;
  let destDir = null;
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--operation' && i + 1 < args.length) {
      operation = args[++i];
    } else if (arg === '--target' && i + 1 < args.length) {
      sourceDir = args[++i];
    } else if (arg === '--destination' && i + 1 < args.length) {
      destDir = args[++i];
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--recursive') {
      options.recursive = true;
    } else if (arg === '--verbose') {
      options.verbose = true;
    } else if (arg === '--help') {
      printHelp();
      process.exit(0);
    }
  }
  
  // Validate arguments
  if (!operation) {
    console.error('Error: Operation is required. Use --operation organize|rename|deduplicate');
    printHelp();
    process.exit(1);
  }
  
  if (!sourceDir) {
    console.error('Error: Source directory is required. Use --target <directory>');
    process.exit(1);
  }
  
  // Execute appropriate operation
  try {
    switch (operation) {
      case 'organize':
        destDir = destDir || path.join(sourceDir, 'organized');
        await organizeByType(sourceDir, destDir, options.dryRun);
        console.log(`Files organized successfully from ${sourceDir} to ${destDir}`);
        break;
        
      case 'rename':
        // Rename operation would be implemented here
        console.log('Rename operation not yet implemented');
        break;
        
      case 'deduplicate':
        // Deduplicate operation would be implemented here
        console.log('Deduplicate operation not yet implemented');
        break;
        
      default:
        console.error(`Unknown operation: ${operation}`);
        printHelp();
        process.exit(1);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Print help information
 */
function printHelp() {
  console.log(`
Directory Automation Tool

Usage:
  node directory-automation.js --operation <operation> --target <directory> [options]

Operations:
  organize      Organize files by type
  rename        Rename files based on pattern
  deduplicate   Remove duplicate files

Options:
  --destination <dir>   Destination directory for organized files
  --dry-run             Show what would be done without making changes
  --recursive           Process directories recursively
  --verbose             Show detailed output
  --help                Show this help
`);
}

    '.css': 'code',
    '.scss': 'code',
    '.py': 'code',
    '.java': 'code',
    '.c': 'code',
    '.cpp': 'code',
    '.php': 'code',
    '.json': 'code',
    '.go': 'code',
    '.rb': 'code',
    '.rs': 'code',
    '.swift': 'code',
    

