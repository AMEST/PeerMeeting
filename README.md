<p align="right"><a href="https://github.com/AMEST/PeerMeeting/blob/master/README_RU.md">Справка на русском</a></p>

[![PeerMeet Build](https://github.com/AMEST/PeerMeeting/actions/workflows/main.yml/badge.svg)](https://github.com/AMEST/PeerMeeting/actions/workflows/main.yml)
![hub.docker.com](https://img.shields.io/docker/pulls/eluki/peer-meeting.svg)
![GitHub release (latest by date)](https://img.shields.io/github/v/release/amest/PeerMeeting)
![GitHub](https://img.shields.io/github/license/amest/PeerMeeting)

<p align="center">
  <a href="https://peer-meeting.nb-47-dev.tk">
    <img alt="PeerMeetingIcon" src="https://github.com/AMEST/PeerMeeting/raw/master/src/PeerMeeting.Host/ClientApp/public/img/icons/android-chrome-512x512.png" width="120" />
  </a>
</p>

# PeerMeeting - simple peer to peer video conference server

- [PeerMeeting - simple peer to peer video conference server](#-peermeeting---simple-peer-to-peer-video-conference-server)
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
2. Screen sharing (with microphone, but only chromium based browsers)
3. In room chat
4. Participants control (volume control, mute one/all participants, kick)
5. Pseudo fullscreen and half screen mode for prticipants blocks
6. Gravatar user avatars
7. Local room history on home page
8. Integration with TURN server (coturn).
9. Application metrics (prometheus endpoint with runtime and endpoints metrics)
10. Service Scaleout with Redis
11. Light and Dark themes (with detect system theme)
12. Multilanguage user interface (Supported EN and RU)

### Security 
High level of security: all connections are protected and encrypted according to the DTLS and SRTP protocols. At the same time, WebRTC works only over the HTTPS protocol, and the site using the technology must be signed with a certificate.
All media traffic goes from user to user (p2p) and does not go through the service infrastructure.
Web sockets for signaling also go only via https.

### Supported browsers
1. Chomium based browsers on windows, linux and android
2. Firefox (work all function with some bugs)
3. Safari >= 15 (work all function with some bugs)

### Screenshots
|||
| ------------- |:-------------:|
| [![Welcome](https://i.postimg.cc/fL2cN337/2021-10-03-14-45-49-localhost-ad5e9a8cad54.png)](https://postimg.cc/62Z2VpfT) | [![Main](https://i.postimg.cc/nrmS0nCY/2021-05-29-19-36-48-peer-meeting-nb-47-dev-tk-6ef14df64714.png)](https://postimg.cc/JH1QhV3G) |
| [![Settings](https://i.postimg.cc/wTKG3RGW/2021-05-29-19-37-22-peer-meeting-nb-47-dev-tk-327dcb51e134.png)](https://postimg.cc/7bVVWhD7) | [![Room](https://i.postimg.cc/tJR2pQCP/2021-10-03-15-10-38-localhost-bf9185ef1da1.png)](https://postimg.cc/R68cLYtV) | 
| [![Two Participants](https://i.postimg.cc/FRVDMsmN/2021-10-03-15-04-54-localhost-3954f0a5e8b1.png)](https://postimg.cc/qhgsnrz5) | [![Three participants](https://i.postimg.cc/kG2xXn80/2021-10-03-14-44-01-localhost-c258612039cf.png)](https://postimg.cc/tnH1BGBk) |
| [![HalfScreen Mode](https://i.postimg.cc/KzvPw7Yv/2021-10-03-14-38-04-localhost-e5f6d0ec1120.png)](https://postimg.cc/ts1NJz6t)|[![Chat](https://i.postimg.cc/cCDTJ9rz/2021-10-03-15-07-16-localhost-3561a7fb305b.png)](https://postimg.cc/T5Dn7cjj)|

## Self-hosted Requirements
* AspNet Core 3.1 runtime or Docker for service start
* Reverse proxy for https connection (may be use Cloudflare)

**For scalae service, needed redis server (version >=6 ) with acl user who can create/pub/sub channels with prefix `peermeeting`**

## Getting started
[**Instructions for launching the application are here**](docs/README.md)
