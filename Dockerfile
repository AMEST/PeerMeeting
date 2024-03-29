FROM alpine/git as version
WORKDIR /src
COPY . /src
RUN echo $(git describe --tags --always 2>/dev/null |  sed 's/-g[a-z0-9]\{7\}//') > /version ;\
    echo "Version: "$(cat /version)

FROM mcr.microsoft.com/dotnet/core/sdk:3.1 AS build
COPY . /build
COPY --from=version /version /build/version
WORKDIR /build
RUN apt-get update -yq ;\
	apt-get install curl gnupg -yq ;\
	curl -sL https://deb.nodesource.com/setup_14.x | bash - ;\
	apt-get install -y nodejs

# Apply calculated version	
RUN sed -i -e "s/<Version>0-develop<\/Version>/<Version>$(cat version | cut -c2- )<\/Version>/g" src/PeerMeeting.Host/PeerMeeting.Host.csproj;\
    dotnet restore -s https://api.nuget.org/v3/index.json; \
    dotnet build --no-restore -c Release; \    
    dotnet publish ./src/PeerMeeting.Host/PeerMeeting.Host.csproj -c Release -o /app --no-build; \
    dotnet nuget locals http-cache --clear;\
    dotnet nuget locals temp --clear


######## PeerMeeting Host
FROM mcr.microsoft.com/dotnet/core/aspnet:3.1-buster-slim as app
COPY --from=build /app /app
WORKDIR /app
EXPOSE 80
ENTRYPOINT ["dotnet", "PeerMeeting.Host.dll"]
