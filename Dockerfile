FROM node

ENV PORT 3000

ENV MONGODB_URL "mongodb://mongodb"

RUN mkdir -p /home/api

COPY . /home/api

CMD [ "node" , "/home/api/index.js" ]