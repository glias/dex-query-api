FROM node:12

WORKDIR /app

ADD package.json .
ADD package-lock.json .
ADD tsconfig.json .
ADD src ./src

RUN npm install -f
RUN npm install typescript -g

RUN tsc

EXPOSE 8080

CMD [ "npm", "start" ]
