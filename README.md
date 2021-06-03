[![PeerMeet Build](https://github.com/AMEST/PeerMeeting/actions/workflows/main.yml/badge.svg)](https://github.com/AMEST/PeerMeeting/actions/workflows/main.yml)
![hub.docker.com](https://img.shields.io/docker/pulls/eluki/peer-meeting.svg)
![GitHub release (latest by date)](https://img.shields.io/github/v/release/amest/PeerMeeting)
![GitHub](https://img.shields.io/github/license/amest/PeerMeeting)
# ![Icon](https://github.com/AMEST/PeerMeeting/raw/master/src/PeerMeeting.Host/ClientApp/public/img/icons/apple-touch-icon-60x60.png) PeerMeeting - simple peer to peer video conference server

- [!Icon PeerMeeting - simple peer to peer video conference server](#-peermeeting---simple-peer-to-peer-video-conference-server)
  - [Links](#links)
  - [Description](#description)
    - [Features](#features)
    - [Security](#security)
    - [Supported browsers](#supported-browsers)
    - [Screenshots](#screenshots)
  - [Self-hosted Requirements](#self-hosted-requirements)
  - [Getting started](#getting-started)

## Links
* **[Try PeerMeeting](https://peer-meeting.nb-47-dev.tk)**  
* **[Docker image](https://hub.docker.com/r/eluki/peer-meeting)**

## Description
Simple peer to peer video conference server over WebRTC. Support more then 2 peoples in p2p conference.   
Start & join meetings for free. No account needed, open service, write you name and open or join room!  

The service is adjusted based on the mesh model. This network is implemented to open multiple (1: 1) interconnected peer-to-peer connections. Maximum peer connections limit per page is 256 (on chrome) i.e. 256 users can connect together!

### Features
1. Video conferencing over p2p with 2+ peoples
2. Local room history on home page
3. Screen sharing (with microphone)
4. Pseudo fullscreen and half screen mode for prticipants blocks
5. Gravatar user avatars
6. Service Scaleout with Redis

### Security 
High level of security: all connections are protected and encrypted according to the DTLS and SRTP protocols. At the same time, WebRTC works only over the HTTPS protocol, and the site using the technology must be signed with a certificate.
All media traffic goes from user to user (p2p) and does not go through the service infrastructure.
Web sockets for signaling also go only via https.

### Supported browsers
1. Chomium based browsers on windows, linux and android
2. Half support firefox (work all function with some bugs)

### Screenshots
|||
| ------------- |:-------------:|
| [![Welcome](https://i.postimg.cc/26MXQ18S/2021-05-29-19-35-57-peer-meeting-nb-47-dev-tk-a023ae34e98b.png)](https://postimg.cc/0MGfx2wT) | [![Main](https://i.postimg.cc/nrmS0nCY/2021-05-29-19-36-48-peer-meeting-nb-47-dev-tk-6ef14df64714.png)](https://postimg.cc/JH1QhV3G) |
| [![Settings](https://i.postimg.cc/wTKG3RGW/2021-05-29-19-37-22-peer-meeting-nb-47-dev-tk-327dcb51e134.png)](https://postimg.cc/7bVVWhD7) | [![Room](https://i.postimg.cc/44H0JQB7/2021-05-29-19-37-58-peer-meeting-nb-47-dev-tk-37aba08e9834.png)](https://postimg.cc/fkZCCm4D) | 
| [![Two Participants](https://i.postimg.cc/4xs2QkZV/2021-05-29-19-40-39-peer-meeting-nb-47-dev-tk-2610b1f08276.png)](https://postimg.cc/mtpSTnPg) | [![Three participants](https://i.postimg.cc/CLj68Lyw/2021-05-29-19-41-31-peer-meeting-nb-47-dev-tk-d00226a75cb3.png)](https://postimg.cc/hftrWnPY) |
| [![HalfScreen Mode](https://i.postimg.cc/dV6HWHtX/2021-05-29-19-41-51-peer-meeting-nb-47-dev-tk-ba27ecdde12c.png)](https://postimg.cc/ts1NJz6t)||

## Self-hosted Requirements
* AspNet Core 3.1 runtime or Docker for service start
* Reverse proxy for https connection (may be use Cloudflare)

**For scalae service, needed redis server (version >=6 ) with acl user who can create/pub/sub channels with prefix `peermeeting`**

## Getting started
[**Instructions for launching the application are here**](docs/README.md)