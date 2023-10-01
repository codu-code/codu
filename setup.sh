#!/bin/bash

# Welcome message
echo "#################################################"
echo "#                                               #"
echo "#         Welcome to Codu Hacktober Fest        #"
echo "#                                               #"
echo "#################################################"

# Instructions for the user
echo "Please create an OAuth app on GitHub by following these steps:"
echo "- Go to https://github.com/settings/developers"
echo "- Click on 'New OAuth App'"
echo "- For 'Homepage URL', copy your URL from Gitpod, and after 'https://' and before your username, add '3000-'"
echo "- For 'Authorization callback URL', copy your 'Homepage URL' and add '/api/auth' to the end"
echo "- Click 'Register application'"
echo "- You will be redirected to another screen with app env variables, keep this page open and proceed with the following prompts:"

# Prompt user for input
read -p "Enter your Client Id env variable: " GITHUB_ID
read -p "Click generate a new client secret. Enter your GitHub Secret env variable: " GITHUB_SECRET
read -p "Copy and past your auth callback url here: " URL

# Create .env file
echo "DATABASE_URL=postgresql://postgres:secret@127.0.0.1:5432/postgres" > .env
echo "GITHUB_ID=$GITHUB_ID" >> .env
echo "GITHUB_SECRET=$GITHUB_SECRET" >> .env
echo "NEXTAUTH_URL=$URL" >> .env

# Run docker-compose
gnome-terminal -- docker-compose up

# Open a new terminal for Prisma commands and npm run dev
gnome-terminal -- bash -c "npx prisma db push; npx prisma db seed; npm run dev"
