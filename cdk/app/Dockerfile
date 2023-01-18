FROM public.ecr.aws/docker/library/node:18-slim

COPY package.json .
COPY package-lock.json .
RUN npm ci

COPY . .

EXPOSE 8080
CMD ["npm", "run", "start"]