#!/bin/bash

# ====================================================================
# HTML Helper Script for Aixtiv Symphony Opus
# ====================================================================
#
# This script helps manage HTML files for the Aixtiv Symphony project:
# 1. Open HTML files in the default browser
# 2. Copy HTML files to the project's public directory
# 3. Integrate SallyPort authentication into HTML files
#
# Usage: ./html-helper.sh [options]
# 
# Author: Aixtiv Symphony Team
# ====================================================================

# Set color codes for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Define paths
PROJECT_DIR="$(pwd)"
PUBLIC_DIR="${PROJECT_DIR}/public"
HTML_FILES=(
  "/Users/as/Downloads/asoos-unified-interface.html"
  "/Users/as/Downloads/asoos-landing-page.html"
)
HTML_FILES_NAMES=("asoos-unified-interface.html" "asoos-landing-page.html")

# Function to display script header
function display_header() {
  clear
  echo -e "${BLUE}===================================================${NC}"
  echo -e "${BLUE}      Aixtiv Symphony Opus - HTML Helper Tool      ${NC}"
  echo -e "${BLUE}===================================================${NC}"
  echo ""
}

# Function to display the main menu
function display_menu() {
  echo -e "${YELLOW}Select an option:${NC}"
  echo -e "1. ${GREEN}Open HTML files in browser${NC}"
  echo -e "2. ${GREEN}Copy HTML files to public directory${NC}"
  echo -e "3. ${GREEN}Integrate SallyPort authentication${NC}"
  echo -e "4. ${GREEN}Run all operations${NC}"
  echo -e "0. ${RED}Exit${NC}"
  echo ""
  echo -ne "${YELLOW}Enter your choice (0-4):${NC} "
  read choice
}

# Function to check if file exists
function check_file_exists() {
  local file_path="$1"
  if [ ! -f "$file_path" ]; then
    echo -e "${RED}Error: File not found at ${file_path}${NC}"
    return 1
  fi
  return 0
}

# Function to check if directory exists
function check_dir_exists() {
  local dir_path="$1"
  if [ ! -d "$dir_path" ]; then
    echo -e "${RED}Error: Directory not found at ${dir_path}${NC}"
    echo -e "${YELLOW}Creating directory...${NC}"
    mkdir -p "$dir_path"
    if [ $? -ne 0 ]; then
      echo -e "${RED}Failed to create directory.${NC}"
      return 1
    fi
    echo -e "${GREEN}Directory created successfully.${NC}"
  fi
  return 0
}

# Function to open HTML files in browser
function open_in_browser() {
  echo -e "${BLUE}Opening HTML files in browser...${NC}"
  
  for file_path in "${HTML_FILES[@]}"; do
    if check_file_exists "$file_path"; then
      echo -e "${YELLOW}Opening ${file_path}...${NC}"
      open "$file_path"
      if [ $? -eq 0 ]; then
        echo -e "${GREEN}Successfully opened ${file_path}${NC}"
      else
        echo -e "${RED}Failed to open ${file_path}${NC}"
      fi
    fi
  done
  
  echo -e "${GREEN}Done opening files.${NC}"
  echo ""
}

# Function to copy HTML files to public directory
function copy_to_public() {
  echo -e "${BLUE}Copying HTML files to public directory...${NC}"
  
  # Check if public directory exists
  if ! check_dir_exists "$PUBLIC_DIR"; then
    return 1
  fi
  
  # Copy each file
  for i in "${!HTML_FILES[@]}"; do
    file_path="${HTML_FILES[$i]}"
    file_name="${HTML_FILES_NAMES[$i]}"
    dest_path="${PUBLIC_DIR}/${file_name}"
    
    if check_file_exists "$file_path"; then
      echo -e "${YELLOW}Copying ${file_path} to ${dest_path}...${NC}"
      cp "$file_path" "$dest_path"
      if [ $? -eq 0 ]; then
        echo -e "${GREEN}Successfully copied ${file_name}${NC}"
      else
        echo -e "${RED}Failed to copy ${file_name}${NC}"
      fi
    fi
  done
  
  echo -e "${GREEN}Done copying files.${NC}"
  echo ""
}

# Function to integrate SallyPort authentication
function integrate_sallyport() {
  echo -e "${BLUE}Integrating SallyPort authentication...${NC}"
  
  # Check if public directory exists
  if ! check_dir_exists "$PUBLIC_DIR"; then
    return 1
  fi
  
  for i in "${!HTML_FILES[@]}"; do
    file_path="${HTML_FILES[$i]}"
    file_name="${HTML_FILES_NAMES[$i]}"
    dest_path="${PUBLIC_DIR}/${file_name}"
    
    if [ ! -f "$dest_path" ]; then
      if check_file_exists "$file_path"; then
        echo -e "${YELLOW}File not in public directory. Copying first...${NC}"
        cp "$file_path" "$dest_path"
      else
        echo -e "${RED}Source file not found. Cannot integrate SallyPort.${NC}"
        continue
      fi
    fi
    
    echo -e "${YELLOW}Integrating SallyPort into ${file_name}...${NC}"
    
    # Create a backup
    cp "$dest_path" "${dest_path}.bak"
    
    # Add SallyPort authentication code
    # 1. Add SallyPort script in the head
    sed -i '' '/<head>/a\
    <!-- SallyPort Authentication -->\
    <script src="https://cdn.sallyport.aixtiv.io/v1/sallyport.min.js"></script>\
    <script>\
        window.SALLYPORT_CONFIG = {\
            clientId: "aixtiv-symphony-opus",\
            redirectUri: window.location.origin + window.location.pathname,\
            scope: "profile email",\
            autoRefresh: true\
        };\
    </script>' "$dest_path"
    
    # 2. Add authentication function
    sed -i '' '/<body/a\
    <div id="sallyport-loading" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 9999;">\
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; text-align: center;">\
            <div class="spinner" style="border: 5px solid #f3f3f3; border-top: 5px solid #3498db; border-radius: 50%; width: 50px; height: 50px; margin: 0 auto; animation: spin 2s linear infinite;"></div>\
            <p style="margin-top: 20px; font-size: 18px;">Authenticating with SallyPort...</p>\
        </div>\
    </div>\
    <style>\
        @keyframes spin {\
            0% { transform: rotate(0deg); }\
            100% { transform: rotate(360deg); }\
        }\
    </style>\
    <script>\
        function authenticateAndRedirect() {\
            document.getElementById("sallyport-loading").style.display = "block";\
            if (window.SallyPort) {\
                SallyPort.login().then(function(authResult) {\
                    console.log("Authentication successful", authResult);\
                    setTimeout(function() {\
                        document.getElementById("sallyport-loading").style.display = "none";\
                        // Redirect to the app or continue on this page\
                    }, 1000);\
                }).catch(function(error) {\
                    console.error("Authentication failed", error);\
                    document.getElementById("sallyport-loading").style.display = "none";\
                    alert("Authentication failed. Please try again.");\
                });\
            } else {\
                console.error("SallyPort SDK not loaded");\
                document.getElementById("sallyport-loading").style.display = "none";\
                alert("Authentication system not available. Please try again later.");\
            }\
        }\
    </script>' "$dest_path"
    
    # 3. Update buttons or links to use authentication
    sed -i '' 's/href="[^"]*academy[^"]*"/onclick="authenticateAndRedirect(); return false;" href="#"/g' "$dest_path"
    sed -i '' 's/href="[^"]*app[^"]*"/onclick="authenticateAndRedirect(); return false;" href="#"/g' "$dest_path"
    sed -i '' 's/onclick="[^"]*"/onclick="authenticateAndRedirect(); return false;"/g' "$dest_path"
    
    echo -e "${GREEN}SallyPort integration completed for ${file_name}${NC}"
  done
  
  echo -e "${GREEN}Done integrating SallyPort authentication.${NC}"
  echo -e "${YELLOW}Note: Check the modified files to ensure integrations are correct.${NC}"
  echo ""
}

# Function to run all operations
function run_all() {
  open_in_browser
  copy_to_public
  integrate_sallyport
}

# Main script execution
display_header

if [ "$#" -eq 0 ]; then
  # Interactive mode
  while true; do
    display_menu
    case $choice in
      1) open_in_browser ;;
      2) copy_to_public ;;
      3) integrate_sallyport ;;
      4) run_all ;;
      0) 
        echo -e "${GREEN}Exiting. Thank you for using HTML Helper!${NC}"
        exit 0 
        ;;
      *) 
        echo -e "${RED}Invalid option. Please try again.${NC}" 
        sleep 1
        ;;
    esac
    
    echo -e "${YELLOW}Press Enter to return to the menu...${NC}"
    read
    display_header
  done
else
  # Command line arguments mode
  case "$1" in
    --open|-o)
      open_in_browser
      ;;
    --copy|-c)
      copy_to_public
      ;;
    --integrate|-i)
      integrate_sallyport
      ;;
    --all|-a)
      run_all
      ;;
    --help|-h)
      echo -e "Usage: $0 [OPTION]"
      echo -e "  -o, --open       Open HTML files in browser"
      echo -e "  -c, --copy       Copy HTML files to public directory"
      echo -e "  -i, --integrate  Integrate SallyPort authentication"
      echo -e "  -a, --all        Run all operations"
      echo -e "  -h, --help       Display this help message"
      exit 0
      ;;
    *)
      echo -e "${RED}Error: Unknown option '$1'${NC}"
      echo -e "Use '$0 --help' for usage information."
      exit 1
      ;;
  esac
fi

