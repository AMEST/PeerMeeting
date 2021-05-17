[![PeerMeet Build](https://github.com/AMEST/PeerMeeting/actions/workflows/main.yml/badge.svg)](https://github.com/AMEST/PeerMeeting/actions/workflows/main.yml)
![hub.docker.com](https://img.shields.io/docker/pulls/eluki/peer-meeting.svg)
![GitHub release (latest by date)](https://img.shields.io/github/v/release/amest/PeerMeeting)
![GitHub](https://img.shields.io/github/license/amest/PeerMeeting)
# ![Icon](https://github.com/AMEST/PeerMeeting/raw/master/PeerMeeting.Host/ClientApp/public/img/icons/apple-touch-icon-60x60.png) PeerMeeting - simple peer to peer video conference server

- [!Icon PeerMeeting - simple peer to peer video conference server](#-peermeeting---simple-peer-to-peer-video-conference-server)
  - [Links](#links)
  - [Description](#description)
  - [Features](#features)
  - [Self-hosted Requirements](#self-hosted-requirements)

## Links
* **[Try PeerMeeting](https://peer-meeting.nb-47-dev.tk)**  
* **[Docker image](https://hub.docker.com/r/eluki/peer-meeting)**

## Description
Simple peer to peer video conference server over WebRTC. Support more then 2 peoples in p2p conference

## Features
1. Video conferencing over p2p with 2+ peoples
2. Local room history on home page


## Self-hosted Requirements
* AspNet Core 3.1 runtime or Docker for service start
* Reverse proxy for https connection (may be use Cloudflare)