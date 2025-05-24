const fs = require('fs')
const path = require('path')

// Function to walk through directory and find all TypeScript files
function findTsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir)

  files.forEach(file => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)

    if (stat.isDirectory()) {
      findTsFiles(filePath, fileList)
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath)
    }
  })

  return fileList
}

// Function to update imports in a file
function updateImports(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8')
    const originalContent = content

    // Replace import statements
    content = content.replace(/from\s+['"]@prisma\/client['"]/g, "from '../prisma/prisma'")

    // Only write to file if changes were made
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8')
      console.log(`Updated imports in: ${filePath}`)
      return true
    }
    return false
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error)
    return false
  }
}

// Main function
function main() {
  const actionsDir = path.join(__dirname, 'src', 'actions')

  // Check if directory exists
  if (!fs.existsSync(actionsDir)) {
    console.error(`Directory not found: ${actionsDir}`)
    process.exit(1)
  }

  // Find all TypeScript files
  const tsFiles = findTsFiles(actionsDir)
  console.log(`Found ${tsFiles.length} TypeScript files in src/actions/`)

  // Update imports in all files
  let updatedCount = 0
  tsFiles.forEach(file => {
    const updated = updateImports(file)
    if (updated) updatedCount++
  })

  console.log(`Updated imports in ${updatedCount} files.`)
}

main()
