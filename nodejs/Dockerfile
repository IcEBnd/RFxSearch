FROM    centos:centos6

# Enable EPEL for Node.js
RUN     rpm -Uvh http://download.fedoraproject.org/pub/epel/6/i386/epel-release-6-8.noarch.rpm
# Install Node.js and npm
RUN     yum install -y npm

# Bundle app source
COPY . /src

# Install app dependencies
RUN cd /src; npm install
RUN npm install -g nodemon

EXPOSE  8080
#CMD ["node", "/src/index.js"]
CMD ["nodemon", "/src/index.js"]
#CMD ["forever", "-w /src/index.js"]

