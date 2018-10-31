FROM amazonlinux:latest

RUN cp -a /etc/skel/.bash* /root && \
    yum -y install awscli curl file gcc gcc-c++ git gzip libcurl-devel make pkgconfig tar wget xz zip zlib

RUN curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.32.0/install.sh | bash && \
    . ~/.nvm/nvm.sh && \
    nvm install 6.10.3 && \
    export NVM_DIR="/root/.nvm"

WORKDIR /root/workspace

ENV PS1='\[\e[31m\]\u@\h\[\e[m\] \[\e[33m\]\w\[\e[m\]\n\$ '

CMD ["/bin/bash"]
