FROM amazonlinux:1

RUN cp -a /etc/skel/.bash* /root && \
    yum -y update && \
    yum -y groupinstall 'Development Tools' && \
    yum -y install libcurl-devel python27-pip python27-setuptools wget && \
    pip install --upgrade pip

RUN curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.32.0/install.sh | bash && \
    . ~/.nvm/nvm.sh && \
    nvm install 6.10.3 && \
    export NVM_DIR="/root/.nvm"

RUN pip install --upgrade awscli

RUN umask 0000

WORKDIR /root/workspace/deployment

ENV PS1='\[\e[31m\]\u@\h\[\e[m\] \[\e[33m\]\w\[\e[m\]\n\$ '

CMD ["/bin/bash"]
