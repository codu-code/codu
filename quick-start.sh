#!/bin/bash
set -e  # Exit immediately if a command exits with a non-zero status

# Define colors
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
NO_COLOUR="\033[0m" # No Color

# Function to display a loading spinner
loading() {
    local pid=$1
    local spinner=("|" "/" "-" "\\")

    while kill -0 "$pid" 2>/dev/null; do
        for i in "${spinner[@]}"; do
            printf "\r${YELLOW}Loading... ${i} ${NO_COLOUR}"
            sleep 0.1
        done
    done
    printf "\r${GREEN}Done!       ${NC}\n"
}

# Start Docker containers
printf "${YELLOW}Starting Docker containers...${NC}\n"
docker compose up -d &
loading $!  # Pass the PID of the last background command
wait
printf "${GREEN}Docker containers started successfully!${NC}\n"

# Run database migrations
printf "${YELLOW}Running database migrations...${NC}\n"
npm run db:migrate &
loading $!  # Pass the PID of the last background command
wait
printf "${GREEN}Database migrations completed successfully!${NC}\n"

# Seed the database
printf "${YELLOW}Seeding the database...${NC}\n"
npm run db:seed &
loading $!  # Pass the PID of the last background command
wait
printf "${GREEN}Database seeding completed successfully!${NC}\n"

# Start the application
printf "${YELLOW}Starting the application...${NC}\n"
npm run dev &
sleep 5  # Wait for 5 seconds
printf "${GREEN}Application started successfully!${NC}\n"

# Open the default browser at localhost:3000
printf "${YELLOW}Opening the browser at http://localhost:3000...${NC}\n"
open http://localhost:3000
