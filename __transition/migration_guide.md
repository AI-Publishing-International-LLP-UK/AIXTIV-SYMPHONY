# ASOOS Migration Guide

## Overview
This document provides guidance for completing the migration from the deprecated `/Users/as/asoos/aixtiv-symphony-opus1.0.1/` directory to the new structure in `/Users/as/asoos/opus/opus1.0.1/`.

## Migration Status

### Already Completed
- The primary migration of files from `aixtiv-symphony-opus1.0.1` to `opus1.0.1` was completed last week
- Most essential files and components have already been integrated into the new structure
- The original directory is now considered deprecated

### Remaining Tasks
- Handle any files that may have been accidentally restored or created in the deprecated directory
- Evaluate these remaining files to determine if they should be integrated or discarded
- Complete the final cleanup and removal of the deprecated directory

## Using the Transition Directory

### Purpose
The `__transition` directory serves as a temporary holding area for any files that need to be evaluated before they are either:
- Integrated into the proper location within the new structure
- Discarded if they are duplicates or no longer needed

### Using the Migration Script
A migration script has been created to help move remaining files from the deprecated directory to this transition directory:

1. **Run the script**: 
   ```bash
   cd /Users/as/asoos/opus/opus1.0.1/__transition
   ./migrate_remaining_files.sh
   ```

2. **Review the log file**:
   After running the script, a log file will be created with details of all files that were moved. This log is useful for tracking what needs to be evaluated.

3. **Verify migration**:
   Check that files have been properly moved to the `__transition/aixtiv-symphony-opus1.0.1/` directory and that the original files are no longer in the deprecated location.

### Evaluating Migrated Files

For each file or directory moved to the transition area, follow this evaluation process:

1. **Check for duplicates**:
   - Determine if the file already exists in the new structure
   - If it exists and is identical, the transition copy can be discarded
   - If it exists but differs, compare the versions to determine which should be kept

2. **Assess relevance**:
   - Determine if the file is still needed for the project
   - Consider if the file contains any unique configurations or code that should be preserved

3. **Integration strategy**:
   - For files that need to be kept, identify the appropriate location in the new structure
   - Move (don't copy) the file to its new location
   - Update any references or dependencies as needed

4. **Documentation**:
   - Document any significant decisions made about file disposition
   - Note any important configurations or settings that were migrated

## Completing the Migration

Once all files have been evaluated and properly handled, follow these steps to complete the migration:

1. **Final verification**:
   - Ensure all needed files have been properly integrated into the new structure
   - Confirm that no essential files remain only in the transition directory

2. **Cleanup**:
   - Delete the deprecated `/Users/as/asoos/aixtiv-symphony-opus1.0.1/` directory
   - Once all files have been processed, the `__transition` directory can also be deleted

3. **Documentation update**:
   - Update project documentation to reflect the new structure
   - Remove references to the old directory in any documentation

4. **Team notification**:
   - Inform all team members that the migration is complete
   - Provide guidance on the new project structure

## Timeline
- Migration started: Previous week
- Transition directory created: May 28, 2025
- Target completion date: As soon as all remaining files have been evaluated

## Support
For questions or assistance with the migration process, please contact the project architect or system administrator.

