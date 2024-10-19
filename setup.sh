#!/bin/bash

echo "#################################################"
echo "#                                               #"
echo "#         Welcome to Codu Hacktober Fest        #"
echo "#                                               #"
echo "#################################################"

echo "Please create an OAuth app on GitHub by following these steps:"
echo "- Go to https://github.com/settings/developers"
echo "- Click on 'New OAuth App'"
echo "- For 'Homepage URL', copy your URL from Gitpod, and after 'https://' and before your username, add '3000-'"
echo "- For 'Authorization callback URL', copy your 'Homepage URL' and add '/api/auth' to the end"
echo "- Click 'Register application'"
echo "- You will be redirected to another screen with app env variables, keep this page open and proceed with the following prompts:"

read -p "Enter your Client Id env variable: " GITHUB_ID
read -p "Click generate a new client secret. Enter your GitHub Secret env variable: " GITHUB_SECRET
read -p "Copy and past your auth callback url here: " URL

echo "- Nice, now open two terminals and run the following commands: "
echo "- Terminal 1) - docker-compose up "
echo "- Terminal 2) - npm db:migrate, npm db:seed, npm run dev "

# Create .env file
echo "DATABASE_URL=postgresql://postgres:secret@127.0.0.1:5432/postgres" > .env
echo "GITHUB_ID=$GITHUB_ID" >> .env
echo "GITHUB_SECRET=$GITHUB_SECRET" >> .env
echo "NEXTAUTH_URL=$URL" >> .env
