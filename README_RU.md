<p align="right"><a href="https://github.com/AMEST/PeerMeeting/blob/master/README.md">Read in English</a></p>

[![PeerMeet Build](https://github.com/AMEST/PeerMeeting/actions/workflows/main.yml/badge.svg)](https://github.com/AMEST/PeerMeeting/actions/workflows/main.yml)
![hub.docker.com](https://img.shields.io/docker/pulls/eluki/peer-meeting.svg)
![GitHub release (latest by date)](https://img.shields.io/github/v/release/amest/PeerMeeting)
![GitHub](https://img.shields.io/github/license/amest/PeerMeeting)

<p align="center">
  <a href="https://peer-meeting.nb-47.ml">
    <img alt="PeerMeetingIcon" src="https://github.com/AMEST/PeerMeeting/raw/master/src/PeerMeeting.Host/ClientApp/public/img/icons/android-chrome-512x512.png" width="120" />
  </a>
</p>

# PeerMeeting - простой сервер p2p видео конференций

- [PeerMeeting - простой сервер p2p видео конференций](#-peermeeting---простой-сервер-p2p-видео-конференций)
  - [Ссылки](#ссылки)
  - [Описание](#описание)
    - [Возможности](#возможности)
    - [Безопасность](#безопасность)
    - [Поддержка в браузерах](#поддержка-в-браузерах)
    - [Скриншоты](#скриншоты)
  - [Требования к размещению на собственном сервере](#требования-к-размещению-на-собственном-сервере)
  - [Приступаем к работе](#приступаем-к-работе)

## Ссылки
* **[Попробовать PeerMeeting](https://peer-meeting.nb-47.ml)**  
* **[Docker image](https://hub.docker.com/r/eluki/peer-meeting)**

## Описание

Начинайте встречи и присоединяйтесь к ним бесплатно. Аккаунт не нужен, откройте сервис, напишите свое имя и создайте или присоединитесь к комнате!
Простой сервер p2p видео конференций на основе технологии WebRTC. Поддерживает от 2-х и более человек в конференции (все в режиме p2p).

Сервис построен на основе модели сети - mesh. Mesh соединяет каждого пользователя друг с другом (1:1) создавая прямые подключения между ними (взаимосвязанные одноранговы соединения).
Максимальное ограничение одноранговых подключений на страницу составляет 256 (в Chrome), т.е. 256 пользователей могут подключаться вместе!

### Возможности
1. P2P Видео-конференции от 2-х и более людей
2. Демонстрации экрана (с одновременной трансляцией микрофона и звука компьютера, но только в браузерах на основе Chromium)
3. Текстовые чаты в конференциях
4. Управление собеседниками (контроль уровня громкости, отключение микрофона у одного или всех собеседников, исключение из конференции)
5. "Псевдо полноэкранный режим" и режим отображения на пол экрана (приближение одного собеседника и уменьшение других)
6. Интаграция с Gravatar для отображения пользоватльских аватарок
7. Локальная история посещенных конференций на главной странице
8. Интеграция с TURN сервером (coturn).
9. Метрики приложения (prometheus формат с метриками по эндпоинтам и среде выполнения приложения)
10. Масштабирование сервиса с помощью Redis
11. Светлая и темная темы (с определением системной темы при первом заходе в сервис)
12. Многоязычный интерфейс (Поддерживается Английский и Русский языки)

### Безопасность 

Высокий уровень безопасности: все соединения защищены и зашифрованы по протоколам DTLS и SRTP. При этом WebRTC работает только по протоколу HTTPS, а сайт, использующий технологию, должен быть подписан сертификатом.
Весь медиатрафик идет от пользователя к пользователю (p2p) и не проходит через инфраструктуру сервиса.
Веб-сокеты для сигнализации тоже идут только по https.

### Поддержка в браузерах
1. Браузеры на основе Chromium на windows, linux, macos и android
2. Firefox (работает весь функционал, но с некоторыми багами)
3. Safari >= 15 (работает весь функционал, но с некоторыми багами)

### Скриншоты
|||
| ------------- |:-------------:|
| [![Welcome](https://i.postimg.cc/fL2cN337/2021-10-03-14-45-49-localhost-ad5e9a8cad54.png)](https://postimg.cc/62Z2VpfT) | [![Main](https://i.postimg.cc/nrmS0nCY/2021-05-29-19-36-48-peer-meeting-nb-47-dev-tk-6ef14df64714.png)](https://postimg.cc/JH1QhV3G) |
| [![Settings](https://i.postimg.cc/wTKG3RGW/2021-05-29-19-37-22-peer-meeting-nb-47-dev-tk-327dcb51e134.png)](https://postimg.cc/7bVVWhD7) | [![Room](https://i.postimg.cc/tJR2pQCP/2021-10-03-15-10-38-localhost-bf9185ef1da1.png)](https://postimg.cc/R68cLYtV) | 
| [![Two Participants](https://i.postimg.cc/FRVDMsmN/2021-10-03-15-04-54-localhost-3954f0a5e8b1.png)](https://postimg.cc/qhgsnrz5) | [![Three participants](https://i.postimg.cc/kG2xXn80/2021-10-03-14-44-01-localhost-c258612039cf.png)](https://postimg.cc/tnH1BGBk) |
| [![HalfScreen Mode](https://i.postimg.cc/KzvPw7Yv/2021-10-03-14-38-04-localhost-e5f6d0ec1120.png)](https://postimg.cc/ts1NJz6t)|[![Chat](https://i.postimg.cc/cCDTJ9rz/2021-10-03-15-07-16-localhost-3561a7fb305b.png)](https://postimg.cc/T5Dn7cjj)|

## Требования к размещению на собственном сервере
* AspNet Core 3.1 runtime или Docker для запуска сервиса
* Обратный прокси для установки шифрованого соединения (https). Возможно использование Cloudflare для этого

**Для масштабирования сервиса, нужен Redis (version >=6 ) с пользователем который может создавать pub/sub каналы и записывать данные в кеш с префиксом `peermeeting`**

## Приступаем к работе
[**Инструкция по запуску приложения находится тут**](docs/README.md)
