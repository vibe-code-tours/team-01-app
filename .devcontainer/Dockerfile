FROM node:22-bookworm

RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get install -y \
    git \
    curl \
    wget \
    sudo \
    postgresql-client \
    redis-tools \
    bash-completion \
    && apt-get clean -y \
    && rm -rf /var/lib/apt/lists/*

ARG USERNAME=node
RUN echo "${USERNAME} ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers.d/${USERNAME}

USER ${USERNAME}
WORKDIR /workspace